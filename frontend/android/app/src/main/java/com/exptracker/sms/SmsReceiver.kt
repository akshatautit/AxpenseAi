package com.exptracker.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.telephony.SmsMessage
import android.util.Log

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action
    if (action != "android.provider.Telephony.SMS_DELIVER") return
    try {
      val bundle: Bundle? = intent.extras
      if (bundle == null) return
      val pdusObj = bundle.get("pdus") as? Array<*>
      val format = bundle.getString("format")
      if (pdusObj == null) return
      val messages = pdusObj.mapNotNull { pdu ->
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
          Log.e("SmsReceiver", "createFromPdu failed", e)
          null
        }
      }
      val fullMessage = messages.joinToString(separator = "") { it.messageBody ?: "" }
      val originating = messages.firstOrNull()?.originatingAddress ?: ""
      Log.d("SmsReceiver", "Received SMS from $originating: $fullMessage")
    } catch (e: Exception) {
      Log.e("SmsReceiver", "Error handling SMS", e)
    }
  }
}
