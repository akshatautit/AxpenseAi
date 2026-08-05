package com.exptracker.sms

import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SmsModule.NAME)
class SmsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "SmsModule"

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
