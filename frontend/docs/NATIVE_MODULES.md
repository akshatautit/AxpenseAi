# Native Modules / Bridging — Complete Guide (Hinglish)

> Ye doc **React Native ke Native Modules (plugins)** samjhata hai — ki ek plugin hoti kya hai, **JS ka call native tak kaise jaata hai**, aur native ka result wapas JS me kaise aata hai. Sab hamare **SmsModule** ke example se.

---

## 1. Plugin / Native Module Hoti Kya Hai?

React Native app **do parts** me banti hai:

```
┌─────────────────────────┐
│  JAVASCRIPT SIDE (JS)   │  ← TypeScript / React code
│  (App.tsx, smsReader)   │     Jo hum likhte hain
└───────────┬─────────────┘
            │  Bridge / Bridging
┌───────────┴─────────────┐
│  NATIVE SIDE (Kotlin)   │  ← Android ka asli code
│  (SmsModule.kt)         │     OS features access karta hai
└─────────────────────────┘
```

- **JS side** me aisi cheezein nahi hoti jo phone ke system se directly baat karein (jaise SMS, camera, storage).
- **Native module** ek chhota sa **plugin** hai jo **Kotlin (Android)** me likha jaata hai, taaki woh phone ke OS features use kar sake.
- React Native ko ye module dikhata hai ek **package** ke through, aur JS me woh module `NativeModules.SmsModule` se milta hai.

### Plugin = Native Module
Simple words me: **Native module = woh code jo Kotlin me likha hai, aur JS se call ho sakta hai.**

---

## 2. Bridging Kya Hai? (Bridge Concept)

**Bridge** ek *translation layer* hai jo JS aur native code ke beech me messages bhejti hai.

```
   JS Thread                        Native Thread
┌──────────────┐    message     ┌──────────────────┐
│ "mujhe SMS   │ ──────────────►│ SmsModule.kt     │
│  chahiye"    │                │ ContentResolver  │
│              │◄───────────────│ se SMS padho     │
│ result mila! │   return       │ (SMS data)       │
└──────────────┘                └──────────────────┘
```

- JS apna **own thread** pe chalta hai.
- Native apna **own thread** pe chalta hai.
- **Bridge** in dono ke beech data pass karta hai — jaise do alag desh ke logon ke beech translator.

### Purani vs Naya Architecture (important!)

| | Old Architecture (Legacy) | New Architecture (abhi use ho rahi) |
|---|---|---|
| Naam | Bridge + TurboModule interop | TurboModule + Fabric |
| Module banane ka tarika | `ReactContextBaseJavaModule` | TurboModule (Codegen specs) |
| Kyu chal raha hai | — | RN me `newArchEnabled=true` (default) |

> **Hamara SmsModule Legacy style ka hai** (`ReactContextBaseJavaModule`). Ye New Architecture me bhi **interop layer** ke through perfectly chalta hai — isliye tumhe TurboModule specs/codegen ki jhanjhat nahi lena padi. ✅

---

## 3. Bridge Par Data Kaise Aata-Jaata Hai (Types Conversion)

JS aur Kotlin ke **data types alag** hote hain. Bridge unhe convert karta hai:

| JavaScript (JS) | Kotlin (Native) |
|---|---|
| `string` | `String` |
| `number` | `Double` / `Int` |
| `boolean` | `Boolean` |
| `Object` (plain) | `ReadableMap` |
| `Array` | `ReadableArray` |
| `null` | `null` |
| Return value (Promise) | `Promise` |

**Example — SmsModule me:**
```kotlin
val map = Arguments.createMap()          // JS Object banane ke liye
map.putString("body", cursor.getString(...))
map.putDouble("date", cursor.getLong(...).toDouble())
map.putBoolean("read", ...)
map.putString("address", ...)
result.pushMap(map)                       // Array me map push
promise.resolve(result)                   // JS ko wapas bhejo
```

JS me ye milta hai:
```ts
{
  body: "...",
  date: 1728000000000,
  read: true,
  address: "HDFCBK",
}
```

---

## 4. Poora Call Flow — JS se Native tak (SmsModule example)

```
Step 1   App.tsx me button click
         └─ onRead() 
             └─ readTransactionsFromSms()        [smsReader.ts]

Step 2   smsReader.ts
         └─ const SmsModule = NativeModules.SmsModule;   ← module ko pakdo
             └─ SmsModule.getAllSms()             ← JS me function call

Step 3   Bridge message bhejta hai
         └─ "SmsModule.getAllSms() call hua hai, promise lo"

Step 4   SmsModule.kt (Kotlin)
         └─ @ReactMethod fun getAllSms(promise: Promise)
             └─ contentResolver.query(Telephony.Sms.Inbox.CONTENT_URI, ...)
                 └─ SMS rows loop karke WritableArray me convert

Step 5   Native result wapas
         └─ promise.resolve(result)   (ya error pe promise.reject)

Step 6   Bridge result wapas JS ko deta hai
         └─ await getAllSms() → SmsMessage[]

Step 7   smsReader me loop: har message → parseSmsMessage()
         └─ ParsedTransaction[] → App.tsx me UI pe dikhta hai
```

---

## 5. Native Module Banane ke 4 Zaroori Steps

Koi bhi native module banana ho to ye **4 cheezein** chahiye:

### Step 1 — Module class (Kotlin)
```kotlin
@ReactModule(name = SmsModule.NAME)
class SmsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "SmsModule"        // ⭐ JS me yehi naam use hoga
  }

  override fun getName(): String = NAME

  @ReactMethod                        // ⭐ JS se call hone wala har function
  fun getAllSms(promise: Promise) {
    // ... kaam
    promise.resolve(result)           // success
    // promise.reject("ERROR_CODE", "msg")   // error
  }
}
```

### Step 2 — Package class (Kotlin)
```kotlin
class SmsPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext):
      List<NativeModule> = listOf(SmsModule(reactContext))
}
```

### Step 3 — App me register karo (MainApplication.kt)
```kotlin
PackageList(this).packages.apply {
    add(SmsPackage())   // ⭐ package yahan add karo
}
```

### Step 4 — JS me use karo (smsReader.ts)
```ts
const SmsModule = NativeModules.SmsModule;   // ⭐ naam same hona chahiye

const all = await SmsModule.getAllSms();     // call
```

> **Golden Rule:** Kotlin me `@ReactModule(name = "SmsModule")` aur JS me `NativeModules.SmsModule` — **naam match karna chahiye**, warna `SmsModule` = `undefined` milega (wahi error jo tumhe pehle aaya tha).

---

## 6. Promise Pattern — Success/Error Kaise Aata Hai

Native me jo bhi function long time leta hai, uske liye `Promise` use hota hai:

```kotlin
@ReactMethod
fun getUnreadSms(promise: Promise) {
  try {
    val result = queryInbox("$COLUMN_READ = 0", null)
    promise.resolve(result)          // ✅ success — JS ko array jaayega
  } catch (e: Exception) {
    promise.reject("SMS_READ_ERROR", e.message, e)   // ❌ error
  }
}
```

JS me:
```ts
try {
  const unread = await SmsModule.getUnreadSms();
} catch (e) {
  // e.message me native ka error aayega
}
```

---

## 7. Naya Native Method Kaise Add Karein (Quick Example)

Maan lo `getSmsCount()` chahiye (kitni SMS hain):

**Kotlin (`SmsModule.kt`):**
```kotlin
@ReactMethod
fun getSmsCount(promise: Promise) {
  try {
    val resolver = reactApplicationContext.contentResolver
    val cursor = resolver.query(
      Telephony.Sms.Inbox.CONTENT_URI,
      arrayOf(Telephony.Sms._ID),
      null, null, null,
    )
    promise.resolve(cursor?.count ?: 0)
    cursor?.close()
  } catch (e: Exception) {
    promise.reject("SMS_READ_ERROR", e.message, e)
  }
}
```

**TypeScript (`smsReader.ts`):** interface me add karo
```ts
interface SmsNativeModule {
  getAllSms(): Promise<SmsMessage[]>;
  getSmsCount(): Promise<number>;   // ← naya
}

export const getSmsCount = async (): Promise<number> =>
  requireSmsModule().getSmsCount();
```

**Use (`App.tsx`):**
```ts
const count = await getSmsCount();
```

> **Native file change ke baad APK rebuild karna zaroori hai:** `npm run android`. Sirf JS reload se native change nahi aayega.

---

## 8. Common Mistakes / Tips

| Problem | Reason | Fix |
|---|---|---|
| `SmsModule` = undefined | Naam mismatch ya app rebuild nahi kiya | Name match check karo, `npm run android` |
| `undefined is not a function` | Module method exist nahi karta (stale JS bundle) | Metro cache reset + rebuild |
| Data JS me galat aata hai | Type conversion (ReadableMap vs Object) | `Arguments.createMap()` use karo |
| `promise.reject` par silent fail | JS me try/catch nahi | Hamesha `await` + try/catch |
| Function JS se call nahi hota | `@ReactMethod` annotation miss | Har method pe `@ReactMethod` lagao |
| Bridge slow | Bada data bar-bar bhejna | Native me hi filter karke chhota data bhejo (jaise hum `getSmsByAddress` me karte hain) |

---

## 9. Native Modules Ki Lifecycle (Short)

```   
App Start
  └─ MainApplication.onCreate()
       └─ PackageList + SmsPackage()
            └─ SmsModule ka instance banta hai
                 └─ JS me NativeModules.SmsModule available
                      └─ jitni baar chaaho call karo (getAllSms, etc.)
```

- Module ka **instance ek hi baar** banta hai (singleton jaisa) — har call me naya instance nahi banta.
- Isliye `reactContext` se app ki state access kar sakte ho.

---

## 10. Recap (Ek Line Me)

> **Native module = Kotlin me likha plugin** jo `@ReactMethod` + `@ReactModule(name)` se JS ko expose hota hai, `ReactPackage` se register hota hai, `MainApplication` me add hota hai, aur JS me `NativeModules.<Name>` se call hota hai — result `Promise` ke through wapas aata hai. 🔁

---

*Documentation date: Aug 2026 | Next: database (Phase 3)*
