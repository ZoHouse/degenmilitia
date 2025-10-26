# 🎮 Degen Militia - Mini Militia Mod Project

A comprehensive modding toolkit for transforming Mini Militia into a custom "Degen Militia" game with unlimited features and complete rebranding capabilities.

![Degen Militia Logo](assets/logo.png)

---

## 📖 What is This?

This repository contains everything you need to:
- ✅ **Reverse engineer** and mod Mini Militia APK (v4.0.42)
- ✅ **Unlock all features**: Unlimited ammo, health, flight, pro pack, etc.
- ✅ **Rebrand completely**: Custom name, icons, graphics, music
- ✅ **Automate the process**: Scripts for patching, building, and signing

Perfect for learning APK modding, ARM binary patching, and Android reverse engineering.

---

## 🚀 Quick Start

### For macOS/Linux Users
```bash
cd scripts
./setup-environment.sh
# Follow the wizard
```

### For Windows Users
```cmd
cd scripts
setup-environment.bat
REM Follow the wizard
```

### What You Need
1. **Java JDK 11+** (Required)
2. **Mini Militia APK v4.0.42** ([Download here](https://www.androidapksbox.com/apk/doodle-army-2-mini-militia-4-0-42-242-old-apk/))
3. **Android device** or emulator for testing

---

## 📚 Documentation

### Platform-Specific Guides
- **📘 [Windows Setup Guide](WINDOWS-SETUP.md)** - Complete guide for Windows users
- **📗 [macOS/Linux Guide](DEGEN-MILITIA-GUIDE.md)** - Complete guide for Unix systems
- **📙 [Quick Start](QUICKSTART.md)** - Fast-track setup for experienced users

### Technical Documentation
- **📕 [Original Technical README](docs/TECHNICAL-README.md)** - Reverse engineering details
- **🛠️ [Scripts Documentation](scripts/README.md)** - Automation scripts reference

---

## ✨ Features

### Game Modifications
- 💎 **Pro Pack Unlocked** - All premium features free
- ❤️ **Unlimited Health** - Never die (set to 100%)
- 🚀 **Unlimited Jetpack** - Fly forever
- 🔫 **No Reload Time** - Instant reload for all weapons
- 💥 **4x Bullets Per Shot** - Quad damage output
- 🔫🔫 **Dual Wield Everything** - Any weapon can be dual-wielded
- 🛒 **All Items Unlocked** - Every shop item purchased
- ⚡ **Unlimited Ammo** - Never run out

### Customization
- 🎨 Custom app name and package
- 🖼️ Replace all graphics and icons
- 🎵 Custom menu music
- 🗺️ Modify map configurations
- 🎨 Change color schemes
- 📝 Rebrand all text strings

---

## 🛠️ What's Included

### Automation Scripts

Located in `scripts/` directory:

#### Cross-Platform Scripts
- **`apply-degen-patches.sh`** (Unix) / **`apply-degen-patches.bat`** (Windows)
  - Automated binary patcher
  - Applies all game modifications
  - Creates automatic backups

- **`setup-environment.sh`** (Unix) / **`setup-environment.bat`** (Windows)
  - Complete environment setup
  - Downloads APKTool
  - Creates project structure
  - Verifies prerequisites

- **`full-rebuild.sh`** (Unix only)
  - Complete build pipeline
  - Patch → Build → Sign → Optimize
  - One command deployment

#### Additional Tools
- **`replaceByte.sh`** - Generic hex patching utility
- **`signit.sh`** - APK signing wrapper
- **`createoffsets.rr2`** - Radare2 offset finder script

---

## 📁 Project Structure

```
degen-militia/
├── README.md                    # This file
├── WINDOWS-SETUP.md            # Windows-specific guide
├── DEGEN-MILITIA-GUIDE.md      # Complete modding guide (Unix)
├── QUICKSTART.md               # Quick reference
├── .gitignore                  # Git ignore rules
│
├── assets/
│   └── logo.png                # Project logo
│
├── scripts/
│   ├── README.md               # Scripts documentation
│   ├── setup-environment.sh    # Unix setup wizard
│   ├── setup-environment.bat   # Windows setup wizard
│   ├── apply-degen-patches.sh  # Unix patcher
│   ├── apply-degen-patches.bat # Windows patcher
│   ├── full-rebuild.sh         # Complete build script (Unix)
│   ├── replaceByte.sh          # Hex editor script
│   ├── signit.sh               # Signing script
│   └── createoffsets.rr2       # Radare2 script
│
└── docs/
    └── TECHNICAL-README.md     # Original technical guide
```

### Generated Directories (Not in Repo)
These are created during setup and ignored by git:

```
~/DegenMilitia/                 # Created by setup script
├── original-apk/               # Place original APK here
├── unpacked/                   # Unpacked APK contents
├── signed-apk/                 # Final signed APKs
├── backups/                    # Automatic backups
└── assets-custom/              # Your custom assets
    ├── icons/
    ├── graphics/
    ├── audio/
    └── fonts/
```

---

## 🎯 Typical Workflow

### 1. Initial Setup
```bash
# Run setup wizard
cd scripts
./setup-environment.sh  # macOS/Linux
# OR
setup-environment.bat   # Windows
```

### 2. Get the APK
- Download Mini Militia v4.0.42
- Place in `~/DegenMilitia/original-apk/mini-militia.apk`

### 3. Unpack
```bash
cd ~/DegenMilitia
java -jar ~/degen-militia-tools/apktool.jar d original-apk/mini-militia.apk -o unpacked
```

### 4. Modify
- Edit text: `unpacked/res/values/strings.xml`
- Replace icons: `unpacked/res/mipmap-*/`
- Replace music: `unpacked/assets/presMix.mp3`
- Change package: `unpacked/AndroidManifest.xml`

### 5. Apply Patches
```bash
cd path/to/repo/scripts
./apply-degen-patches.sh ~/DegenMilitia/unpacked/lib/armeabi-v7a/libcocos2dcpp.so
```

### 6. Build & Sign
```bash
# Option 1: Use full rebuild script (Unix only)
./full-rebuild.sh

# Option 2: Manual
cd ~/DegenMilitia
java -jar ~/degen-militia-tools/apktool.jar b unpacked -o degen-militia.apk
keytool -genkey -v -keystore mykey.keystore -alias mykey -keyalg RSA -keysize 2048 -validity 10000
jarsigner -keystore mykey.keystore degen-militia.apk mykey
```

### 7. Install
```bash
adb install degen-militia.apk
```

---

## 🔧 Technical Details

### Binary Patching
All game modifications are done by patching ARM assembly instructions in `libcocos2dcpp.so`:

| Feature | Method | Address | Hex Patch |
|---------|--------|---------|-----------|
| Pro Pack | Always return true | 0x0054e96a | `01 20` |
| Health | Set to 100% | 0x004d8ff6 | `64 20` |
| Flight | Always return true | 0x004d7f2a | `01 1c` |
| No Reload | Return 0 | 0x00518358 | `00 20` |
| 4x Bullets | Return 4 | 0x00518666 | `04 20` |
| Dual Wield 1 | Always return true | 0x00518696 | `01 20` |
| Dual Wield 2 | Always return true | 0x005186b6 | `01 20` |
| All Items | Return true | 0x003d053e | `01 1c` |

### How It Works
1. **APKTool** decompiles APK to readable format
2. **Modify resources** (XML, images, audio)
3. **Patch binary** using `dd` (Unix) or PowerShell (Windows)
4. **APKTool** recompiles to APK
5. **jarsigner** signs with your key
6. **Install** on Android device

---

## 🎨 Customization Ideas

### Weapon Rebranding
- Sniper → "Degen Deleter"
- Shotgun → "Degen Spreader"
- SMG → "Degen Sprayer"
- Rocket Launcher → "Degen Yeeter"

### UI Text
- "Play" → "LFG"
- "Training" → "Git Gud"
- "Pro Pack" → "Degen Pack"
- "Quick Match" → "Quick Degen"

### Color Schemes
- **Purple Degen**: `#9D4EDD`, `#7B2CBF`, `#00F5FF`
- **Neon Degen**: `#00FF00`, `#FF00FF`, `#00FFFF`
- **Dark Mode**: `#10002B`, `#E0AAFF`, `#FFFFFF`

---

## ⚠️ Important Notes

### Legal & Ethical
- ✅ **Educational purposes only**
- ✅ **Personal use and learning**
- ❌ **Do NOT distribute commercially**
- ❌ **Do NOT claim as original work**
- ❌ **Respect original creators**

### Version Compatibility
- ✅ **Works with Mini Militia v4.0.42 only**
- ❌ Newer versions removed LAN mode
- ❌ Different versions have different memory addresses

### Security
- ✅ **Never commit keystores** (`.keystore`, `.jks`)
- ✅ **Never share signing keys**
- ✅ **Keep backups of originals**
- ✅ **Test on emulator first**

---

## 🐛 Troubleshooting

### Common Issues

**"Java not found"**
- Install Java JDK 11+ from [Adoptium](https://adoptium.net/)

**"APK build failed"**
- Check XML files for syntax errors
- Ensure no special characters in paths
- See platform-specific guides

**"App won't install"**
- Enable "Unknown Sources" in Android settings
- Uninstall original Mini Militia first
- Verify APK is signed: `jarsigner -verify yourapp.apk`

**"App crashes on launch"**
- Rebuild without binary patches first
- Check all resources exist
- Use `adb logcat` to see errors

See platform-specific guides for more troubleshooting.

---

## 📖 Learning Resources

- **APKTool**: https://ibotpeaches.github.io/Apktool/
- **Radare2**: https://book.rada.re/
- **ARM Assembly**: https://developer.arm.com/documentation/
- **Android Dev**: https://developer.android.com/

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Fork and experiment
- Create issues for bugs
- Submit pull requests
- Share your modifications

---

## 📜 Credits

- **Original Game**: Appsomniacs Interactive
- **Modding Techniques**: Reverse engineering community
- **APKTool**: iBotPeaches
- **Radare2**: pancake and contributors

---

## 📄 License

This project is for **educational purposes only**.

The original Mini Militia game and all associated assets are property of their respective owners. This project is a fan-made modification for learning purposes.

---

## 🎮 Let's Build!

Ready to create Degen Militia? Choose your platform:

- **Windows**: Start with [WINDOWS-SETUP.md](WINDOWS-SETUP.md)
- **macOS/Linux**: Start with [DEGEN-MILITIA-GUIDE.md](DEGEN-MILITIA-GUIDE.md)
- **Quick Start**: See [QUICKSTART.md](QUICKSTART.md)

---

**🚀 From Mini to Degen - Let's get it! 🚀**
