package com.exptracker.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Telephony
import android.telephony.SmsMessage
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule

@ReactModule(name = SmsModule.NAME)
class SmsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "SmsModule"

    private const val EVENT_NEW_SMS = "onNewSms"

    private const val COLUMN_ID = Telephony.Sms._ID
    private const val COLUMN_THREAD_ID = Telephony.Sms.THREAD_ID
    private const val COLUMN_ADDRESS = Telephony.Sms.ADDRESS
    private const val COLUMN_DATE = Telephony.Sms.DATE
    private const val COLUMN_READ = Telephony.Sms.READ
    private const val COLUMN_BODY = Telephony.Sms.BODY
    private const val COLUMN_TYPE = Telephony.Sms.TYPE

    private val PROJECTION = arrayOf(
      COLUMN_ID,
      COLUMN_THREAD_ID,
      COLUMN_ADDRESS,
      COLUMN_DATE,
      COLUMN_READ,
      COLUMN_BODY,
      COLUMN_TYPE,
    )

    private const val SORT_DESC = "${COLUMN_DATE} DESC"
  }

  // Naya SMS aane par JS ko onNewSms event emit karta hai (live transactions).
  private val receivedSmsReceiver: BroadcastReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
      try {
        val bundle: Bundle = intent.extras ?: return
        val pdus = bundle.get("pdus") as? Array<*> ?: return
        val format = bundle.getString("format")
        val messages = pdus.mapNotNull { pdu ->
          try {
            val bytes = when (pdu) {
              is ByteArray -> pdu
              is String -> pdu.toByteArray()
              else -> null
            } ?: return@mapNotNull null
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
              SmsMessage.createFromPdu(bytes, format)
            } else {
              @Suppress("DEPRECATION")
              SmsMessage.createFromPdu(bytes)
            }
          } catch (e: Exception) {
            Log.e("SmsModule", "createFromPdu failed", e)
            null
          }
        }
        val body = messages.joinToString(separator = "") { it.messageBody ?: "" }
        if (body.isBlank()) return
        val address = messages.firstOrNull()?.originatingAddress ?: ""
        val map = Arguments.createMap()
        map.putString("id", "")
        map.putString("threadId", "")
        map.putString("address", address)
        map.putDouble("date", System.currentTimeMillis().toDouble())
        map.putBoolean("read", false)
        map.putString("body", body)
        map.putInt("type", 1)
        reactApplicationContext
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          .emit(EVENT_NEW_SMS, map)
        Log.d("SmsModule", "onNewSms emitted from $address")
      } catch (e: Exception) {
        Log.e("SmsModule", "Error handling received SMS", e)
      }
    }
  }

  init {
    val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
    ContextCompat.registerReceiver(
      reactContext,
      receivedSmsReceiver,
      filter,
      ContextCompat.RECEIVER_EXPORTED,
    )
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun getAllSms(promise: Promise) {
    query(Telephony.Sms.Inbox.CONTENT_URI, null, null, promise)
  }

  @ReactMethod
  fun getUnreadSms(promise: Promise) {
    query(
      Telephony.Sms.Inbox.CONTENT_URI,
      "$COLUMN_READ = 0",
      null,
      promise,
    )
  }

  @ReactMethod
  fun getSmsByAddress(address: String, promise: Promise) {
    query(
      Telephony.Sms.Inbox.CONTENT_URI,
      "$COLUMN_ADDRESS = ?",
      arrayOf(address),
      promise,
    )
  }

  private fun query(
    uri: Uri,
    selection: String?,
    selectionArgs: Array<String>?,
    promise: Promise,
  ) {
    try {
      val resolver = reactApplicationContext.contentResolver
      val cursor: Cursor? =
        resolver.query(uri, PROJECTION, selection, selectionArgs, SORT_DESC)

      cursor ?: run {
        promise.reject("SMS_READ_ERROR", "Unable to query SMS inbox")
        return
      }

      cursor.use { c ->
        val result: WritableArray = Arguments.createArray()
        while (c.moveToNext()) {
          result.pushMap(cursorToMap(c))
        }
        promise.resolve(result)
      }
    } catch (e: Exception) {
      promise.reject("SMS_READ_ERROR", e.message, e)
    }
  }

  private fun cursorToMap(cursor: Cursor): WritableMap {
    val map = Arguments.createMap()
    map.putString("id", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_ID)))
    map.putString("threadId", cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_THREAD_ID)))
    map.putString("address", getStringOrNull(cursor, COLUMN_ADDRESS))
    map.putDouble("date", cursor.getLong(cursor.getColumnIndexOrThrow(COLUMN_DATE)).toDouble())
    map.putBoolean("read", cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_READ)) == 1)
    map.putString("body", getStringOrNull(cursor, COLUMN_BODY))
    map.putInt("type", cursor.getInt(cursor.getColumnIndexOrThrow(COLUMN_TYPE)))
    return map
  }

  private fun getStringOrNull(cursor: Cursor, columnName: String): String? {
    val index = cursor.getColumnIndex(columnName)
    return if (index != -1 && !cursor.isNull(index)) cursor.getString(index) else null
  }
}
