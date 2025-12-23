# Admin Routes Refactoring Guide

Your `admin.js` file is now **2356 lines** - it's time to split it into manageable modules!

## Current Structure

The file contains routes for:
- ✅ Dashboard/Summary/Metrics (moved to `dashboard.js`)
- ✅ Activity Logs (moved to `activity.js`)
- ⏳ Users Management (~400 lines)
- ⏳ Foods Management (~500 lines)
- ⏳ APK Management (~200 lines)
- ⏳ Recognitions/AI Logs (~600 lines)
- ⏳ Avatars (~300 lines)
- ⏳ Login/Auth (~50 lines)
- ⏳ Analytics (~200 lines)

## New Modular Structure

```
fyp-backend/routes/admin/
├── index.js          (main router - combines all modules)
├── dashboard.js      ✅ DONE
├── activity.js       ✅ DONE
├── users.js          ⏳ TODO
├── foods.js          ⏳ TODO
├── apk.js            ⏳ TODO
├── recognitions.js   ⏳ TODO
├── avatars.js        ⏳ TODO
└── auth.js           ⏳ TODO
```

## How to Refactor Each Module

### Pattern for Each Module:

```javascript
// routes/admin/users.js
const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../../services/supabase.js");

// All user-related routes go here
router.get("/", async (req, res) => {
  // GET /admin/users
});

router.get("/:id", async (req, res) => {
  // GET /admin/users/:id
});

// ... etc

module.exports = router;
```

### Then in index.js:

```javascript
const usersRoutes = require("./users");
router.use("/users", usersRoutes);
```

## Benefits

1. **Easier to maintain** - Each file is ~200-400 lines instead of 2356
2. **Better organization** - Related routes grouped together
3. **Easier to test** - Test each module independently
4. **Team collaboration** - Multiple developers can work on different modules
5. **Faster to find code** - Know exactly where to look

## Migration Steps

1. ✅ Create `routes/admin/` directory
2. ✅ Create `dashboard.js` and `activity.js`
3. ⏳ Extract users routes → `users.js`
4. ⏳ Extract foods routes → `foods.js`
5. ⏳ Extract other routes
6. ⏳ Update `routes/admin.js` to use `routes/admin/index.js`
7. ⏳ Test all endpoints

## Quick Start

To use the new structure, update `server.js`:

```javascript
// Change from:
const adminRoutes = require("./routes/admin.js");

// To:
const adminRoutes = require("./routes/admin/index.js");
```

Then gradually move routes from `admin.js` to the modular files.

