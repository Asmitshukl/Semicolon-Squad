# Officer Creation Guide

## Validation Requirements

When provisioning a new officer through the admin panel, the following validations apply:

### 1. **Full Name**

- ✅ Minimum 2 characters required
- Example: "Uday" is valid

### 2. **Official Email**

- ✅ Must be a valid email format (xxx@xxx.xxx)
- Example: "hello@gmail.com" is valid
- ❌ Invalid: "hello", "hello@", "hello@gmail"

### 3. **Official Mobile** ⚠️ MOST COMMON ERROR

- ✅ Must be exactly **10 digits**
- ✅ Must start with **6, 7, 8, or 9**
- Pattern: `^[6-9]\d{9}$`
- ❌ Your current number "123456879" is **INVALID** (only 9 digits)
- ✅ Valid examples: "9876543210", "8765432109", "7654321098"

### 4. **Badge Number**

- ✅ Minimum 3 characters required
- ✅ Must be unique
- Example: "154" is valid (3 digits)

### 5. **Station Code** ⚠️ REQUIRED FIELD

- ✅ Minimum 3 characters required
- Must match an existing Police Station code in the system
- Example: "DELHI01", "MH001", etc.
- **This field was not visible/filled in your attempt**

### 6. **Rank**

- Optional field
- Default: "Officer"
- Examples: "Sub-Inspector", "Constable", "Inspector"

### 7. **Temporary Password**

- ✅ Minimum 8 characters required
- Example: "TempPass@123"

## How to Fix Your Previous Attempt

Your form submission failed because:

1. ❌ **Phone Number**: "123456879" has only 9 digits
   - **Fix**: Use a valid 10-digit Indian mobile number starting with 6-9
   - **Example**: "9876543210"

2. ❌ **Station Code**: Not provided
   - **Fix**: Enter the station code (minimum 3 characters)
   - **Example**: "DELHI01"

## Correct Example

```
Full Name: Uday Kashyap
Official Email: hello@gmail.com
Official Mobile: 9876543210  ← 10 digits, starts with 6-9
Badge Number: 154
Station Code: DELHI01  ← Must exist in system
Rank: Sub-Inspector
Temporary Password: TempPass@123  ← At least 8 characters
```

## Next Steps

1. Get the correct station code from your database or admin
2. Use a valid 10-digit mobile number
3. Fill in all required fields
4. Click "Create Officer"

## Error Messages You Might See

- `"Enter a valid 10-digit Indian mobile number."` → Phone number format is wrong
- `"Police station not found for this station code."` → Station code doesn't exist
- `"An officer with this badge number already exists."` → Badge already taken
- `"Enter a valid email address."` → Email format is incorrect
