# Axpense / ExpTracker — Architecture & Documentation (Hinglish)

> Ye doc me **poora project architecture**, **tech stack**, **data flow**, **har file kya karti hai** aur **hardcoded cheezein kyun hain** — sab samjhaya gaya hai. End me ye bhi bataya hai ki **kya-kya change kar sakte ho**.

---

## 1. Project Kya Hai?

Ek **React Native expense-tracking app**. Ye SMS se bank transactions padhti hai, unhe standard format me convert karti hai (`ParsedTransaction`), aur future me database, analytics, AI chatbot, voice, alerts — sab isi data pe banenge.

Current status: **Phase 2** — SMS read + parse ka engine ban chuka hai.

---

## 2. Tech Stack (kaunsi tech use hui)

| Layer | Technology | Version |
|---|---|---|
| Language (JS side) | TypeScript | 5.8 |
| UI framework | React Native | 0.86.2 |
| JS engine | Hermes | (RN default) |
| Native language (Android) | Kotlin | 2.1.20 |
| Android build | Gradle / AGP | 9.3.1 / 36.0.0 |
| Minimum Android version | minSdk | 24 |
| Navigation (demo) | react-native-safe-area-context | 5.5.2 |
| Database / Backend | ❌ Abhi nahi hai (Phase 3+ me aayega) |

> **Koi npm SMS package nahi use kiya** — humne apna **native Kotlin module** banaya hai (SmsModule). Isliye `jcenter()` wali problems bhi nahi.

---

## 3. Architecture / Data Flow

```
                    ┌─────────────────────────────┐
                    │   Android SMS Inbox (phone) │
                    └─────────────┬───────────────┘
                                  │ ContentResolver (query)
                                  ▼
                    ┌─────────────────────────────┐
                    │   SmsModule.kt (NATIVE)     │
                    │   getAllSms / getUnreadSms  │
                    │   getSmsByAddress           │
                    └─────────────┬───────────────┘
                                  │ NativeModules bridge
                                  ▼
                    ┌─────────────────────────────┐
                    │   smsReader.ts (JS side)    │
                    │   permission check + read   │
                    └─────────────┬───────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │   smsParser.ts              │
                    │   + genericParser.ts        │
                    │   (raw text → transaction)  │
                    └─────────────┬───────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │   ParsedTransaction[]       │
                    │   (standard format)         │
                    └─────────────┬───────────────┘
                                  ▼
                          App.tsx (UI demo)
```

### Flow ko short me:

1. Phone me SMS aati hai (HDFC/SBI/ICICI se).
2. **Kotlin module** Android ke `ContentResolver` se inbox query karta hai.
3. Raw SMS **JS (TypeScript)** tak aati hai.
4. **Parser** SMS text ko samajh kar `{amount, type, merchant, ...}` me badalta hai.
5. App UI me result dikhta hai.

---

## 4. Har File Kya Karti Hai (with imports/exports)

### 📁 `App.tsx` — UI / Entry Point
- **Kya karta hai:** Sab se pehle ye file run hoti hai. Ek simple screen jisme 3 buttons hain:
  - *Check permission* → kya SMS permission mil chuki hai
  - *Grant SMS permission* → user se permission maangta hai
  - *Read & parse SMS* → SMS padho, parse karo, result dikhao
- **Imports:** `react`, `react-native` (ScrollView, Text, Pressable), `react-native-safe-area-context` (SafeAreaView), `smsPermission.ts`, `smsReader.ts`, `types.ts`.
- **Exports:** `App` (default).

> ⚠️ Ye **sirf demo/test screen** hai. Real app me iski jagah navigation (Dashboard, Transactions, etc.) aayega.

---

### 📁 `src/features/sms/types.ts` — Sab Types yahin
- **Kya karta hai:** Poori app ke shared types define karta hai. Ye "contract" hai — koi bhi file inhe import karke same structure use karti hai.
- **Types:**
  - `SmsMessage` — raw SMS ka shape (id, address, body, date, read, type) — **Kotlin module se aane wala data**
  - `ParsedTransaction` — parsed transaction ka shape (amount, type, merchant, paymentMethod, etc.)
  - `PaymentMethod` — UPI / ATM / NEFT / etc. (union type)
  - `TransactionType` — `'credit' | 'debit'`
  - `SmsQueryOptions` — filter options (abhi use me nahi, future ke liye)

---

### 📁 `src/features/sms/smsPermission.ts` — Permission Handling
- **Kya karta hai:** Android ka `PermissionsAndroid` use karke READ_SMS permission check/request karta hai.
- **Functions:**
  - `hasSmsPermission()` → kya permission already hai (true/false)
  - `requestSmsPermission()` → system dialog dikhata hai, result true/false
  - `ensureSmsPermission()` → pehle check, agar nahi hai to request (ready-made helper)
- **Imports:** `react-native` (PermissionsAndroid, Platform).
- **Exports:** teeno functions.

> Ye puri **JS side** me hai, native module ki zaroorat nahi — RN ka built-in `PermissionsAndroid` hi kaafi hai.

---

### 📁 `src/features/sms/smsReader.ts` — Native Bridge + Orchestration
- **Kya karta hai:** Native Kotlin module ko JS se call karta hai. Ye bridge hai.
- **Important line:**
  ```ts
  const SmsModule = NativeModules.SmsModule;
  ```
  Ye wahi module hai jo **SmsModule.kt** me `@ReactModule(name = "SmsModule")` se banaya gaya hai. **Ise same name rehna zaroori hai.**
- **Functions:**
  - `getAllSms()` → saari SMS laao
  - `getUnreadSms()` → sirf unread SMS
  - `getSmsByAddress(address)` → kisi ek sender ki SMS (jaise "HDFCBK")
  - `readTransactionsFromSms({limit})` → **main function**: permission check → SMS lao → har SMS parse karo → `ParsedTransaction[]` return
- **Imports:** `react-native` (NativeModules, Platform), `smsParser.ts`, `smsPermission.ts`, `types.ts`.
- **Exports:** upar ke saare functions.

> `requireSmsModule()` error deta hai agar native module mila nahi — "Rebuild the app" message ke saath.

---

### 📁 `src/features/sms/smsParser.ts` — Smart Layer (bank + date add)
- **Kya karta hai:** Generic parser ka result leta hai aur usme **bank name** + **date/time** add karta hai (jo SMS ke metadata se aate hain).
- **Hardcoded cheez:** `BANK_SENDERS` list — sender (address) ko bank name se map karti hai:
  ```ts
  [/HDFCBK|VM-HDFCBK/i, 'HDFC Bank'],
  [/SBIINB|SBIUPI|SBIIN/i, 'State Bank of India'],
  ...
  ```
- **Functions:**
  - `parseSmsMessage(message: SmsMessage)` → raw SMS object leta hai, parsed transaction return karta hai (bankName, date, time ke saath)
  - `detectBankName(sender)` → sender string se bank ka naam match karta hai
- **Exports:** `parseSmsMessage` (+ re-exports `parseGenericTransactionSms`).

> ⚠️ **Note:** Is file me `parseTransactionSms = parseGenericTransactionSms` bhi export hota hai (old-style string parser) — future compatibility ke liye rakha hai.

---

### 📁 `src/features/sms/parsers/genericParser.ts` — Sabse Zaroori Parsing Logic
- **Kya karta hai:** Ek raw SMS **string** (jaise `"Rs. 850 debited from A/c XX1234 to SWIGGY"`) ko `ParsedTransaction` me convert karta hai. **RegEx (pattern matching)** se.
- **Step by step parsing:**
  1. Text normalize (`\s+` → single space)
  2. Transaction keyword check (`debited`, `credited`, `spent`...) — nahi to `null`
  3. **Amount** extract (`₹` / `Rs.` / `INR` ke baad)
  4. **Credit ya Debit** decide karo
  5. **Payment method** detect (`UPI`, `ATM`, `NEFT`, `IMPS`, card...)
  6. **Account number** extract
  7. **Balance** extract (`Avl Bal` ke baad)
  8. **Reference/UPI txn id** extract
  9. **Merchant** extract (`to SWIGGY`, `at AMAZON`, `for Netflix`)
- **Exports:** `parseGenericTransactionSms(message: string)`.
- **Imports:** `types.ts` (ParsedTransaction, PaymentMethod, TransactionType).

> Ye **sabse important file hai** — iske RegEx hi decide karte hain ki kitne SMS sahi parse honge.

---

### 📁 `android/.../sms/SmsModule.kt` — Native Android Module (Kotlin)
- **Kya karta hai:** Android ke **ContentResolver** se SMS inbox query karta hai.
- **Key parts:**
  - `@ReactModule(name = "SmsModule")` → JS me `NativeModules.SmsModule` se accessible
  - `PROJECTION` → kaunse columns chahiye (id, address, body, date, read, type)
  - `getAllSms(promise)` → saari SMS (`DATE DESC` order me)
  - `getUnreadSms(promise)` → `READ = 0` wali
  - `getSmsByAddress(address, promise)` → ek sender ki
  - `cursorToMap()` → har SMS row ko JS-friendly map me
- **Imports:** `android.provider.Telephony`, `android.database.Cursor`, `com.facebook.react.bridge.*`.

> **Promise pattern:** Native side `promise.resolve(data)` ya `promise.reject(error)` karta hai — JS side `await` karke value leti hai.

---

### 📁 `android/.../sms/SmsPackage.kt` — Module Register Karne ka Package
- **Kya karta hai:** `SmsModule` ko React Native ko "introduce" karta hai.
  ```kotlin
  class SmsPackage : ReactPackage {
      override fun createNativeModules(...) = listOf(SmsModule(reactContext))
  }
  ```

---

### 📁 `android/.../MainApplication.kt` — Module Ko App Me Add Karna
- **Kya karta hai:** App startup pe saare packages load karta hai. Humne apna package yahan manually add kiya:
  ```kotlin
  PackageList(this).packages.apply {
      add(SmsPackage())   // ← humara SMS module
  }
  ```

> Har naya native module yahan add karna padta hai (ya autolinking se).

---

### 📁 `android/.../AndroidManifest.xml` — Permissions
- **Kya karta hai:** Android ko batata hai app ko kya permissions chahiye.
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.READ_SMS" />
  ```

> `READ_SMS` ke bina SMS query hi nahi hogi. Ye **runtime permission** bhi hai — isliye App me "Grant permission" button hai.

---

## 5. Hardcoded Cheezein — Kyon Hain?

Tumne poocha ki **kuch cheezein hardcoded kyun hain**. Ye intentional hai — **Phase 2 me hum data-driven nahi, rule-based approach use kar rahe hain.** Jaise-jaise app badhega, ye constants/config ya database me shift honge.

| Hardcoded cheez | Kahan hai | Kyon hai | Change kaise karein |
|---|---|---|---|
| **Bank sender list** (`HDFCBK → HDFC Bank`) | `smsParser.ts` `BANK_SENDERS` | Har bank ka SMS sender number alag hota hai; abhi manually map kiya hai | List me naya `[regex, 'Bank Name']` add karo |
| **Transaction keywords** (`debited`, `credited`...) | `genericParser.ts` line 17 | SMS me in words se hi pata chalta hai ki transaction hai | Regex me words add karo |
| **Payment method words** (UPI, ATM, NEFT...) | `genericParser.ts` `detectPaymentMethod` | SMS text se method detect karte hain | Regex extend karo |
| **Merchant extraction rules** (`to X`, `at X`, `for X`) | `genericParser.ts` `extractMerchant` | Common patterns jo banks use karte hain | Regex improve karo |
| **Demo UI me limit 200** | `App.tsx` | Sirf demo ke liye | Koi bhi number |
| **`testParser.ts` me sample SMS** | `src/features/sms/testParser.ts` (comment me) | Manual testing ke liye sample messages | Apne real bank SMS add karke test karo |

### Kya Tum Ye Change Kar Sakte Ho? — **Haan, bilkul!**

- **Naya bank add karna** (jaise `[^BOB/i, 'Bank of Baroda']`):
  ```ts
  [/BOBSMS|^BOB/i, 'Bank of Baroda'],
  ```
  Sirf `smsParser.ts` ki list me ek line add karo.

- **Parser me naya pattern**: `genericParser.ts` me naya regex ya nayi `detect*` function banao, phir `parseGenericTransactionSms` me use karo.

- **Naya native method** (jaise `getSmsCount()`): `SmsModule.kt` me:
  ```kotlin
  @ReactMethod
  fun getSmsCount(promise: Promise) { ... promise.resolve(count) }
  ```
  aur `smsReader.ts` me:
  ```ts
  getSmsCount: () => Promise<number>;
  ```
  add karke use karo.

---

## 6. Kuch Important Rules (change karte waqt dhyan rakho)

1. **Name matching mandatory:** `SmsModule.kt` me `@ReactModule(name = "SmsModule")` aur JS me `NativeModules.SmsModule` — **same name hona chahiye.**
2. **Naya native module add karo to:** `SmsPackage.kt` me register karo aur `MainApplication.kt` me `add(SmsPackage())` karo.
3. **Native code change ke baad:** APK rebuild zaroori hai (`npm run android`) — sirf JS reload kafi nahi.
4. **ParsedTransaction shape change karo to:** `types.ts` badlo, phir parser aur jo bhi consume karta hai update karo (TS error dikha dega — ye fayda hai).
5. **Regex me commas/rupees handle hoti hai**, lekin naye SMS formats me fail ho sakte hain → sample messages ke saath test karo.

---

## 7. Abhi Kya Nahi Hai (Future Roadmap)

```
Phase 2 ✅  SMS read + parse (ye ho chuka)
Phase 3 ⏳  Transaction Database (store karna)
Phase 4    Transaction list + Dashboard
Phase 5    Backend API + Auth + Sync
Phase 6    Categorization + Analytics + Insights
Phase 7    AI Chatbot (intent-based)
Phase 8    Voice (Speech → AI → Speech)
Phase 9    Smart Alerts + Anomaly detection
```

> **Sabse important design rule:** AI ko paisa calculate mat karo — AI sirf question samjhega, **backend/DB calculate karega**, AI response likhega.

---

## 8. Quick Start Commands

```bash
npm install          # dependencies install
npm run android      # build + install + run
npx tsc --noEmit     # TypeScript type check
npx eslint .         # lint check
```

---

Android 15 +


Settings me app dhoondo
Phone ki Settings app kholo, upar search bar me apni app ka naam type karo (jaise 'Axpense'), ya Apps → See all apps me jaake dhoondo.
2
3-dot menu se restricted settings allow karo
App ke detail page pe upar-right corner me teen dots (⋮) ka icon dikhega — usme tap karo. Menu me ek option milega 'Allow restricted settings'.
3
Device authentication se confirm karo
Isko tap karte hi phone tumse confirmation maangega — PIN, pattern, ya fingerprint se verify karna hoga (ye Google ka intentional friction hai, security ke liye).
4
App wapas kholo aur dobara try karo
Ab wapas app kholo aur permission request trigger karo (button dabao). Dialog ab normally show hona chahiye. Ya phir Settings → App → Permissions → SMS me jaake dekho — toggle ab clickable hoga.


*Documentation date: Aug 2026 | Phase 2 complete*
