# User Flow: Authentication Pages

## Flow 1: New User Sign Up

### Context
First-time user discovers topaitoolrank.com, decides to use WA Sender tool, needs to create account.

### Storyboard

**Screen 1: Homepage Hero**
- User sees "Build the software your business actually needs"
- Reads about AI-first automation
- Sees "View Services" or "Discuss Your Project" CTAs
- Clicks "Discuss Your Project" or navigates to Tools → WA Sender

**Screen 2: WA Sender Tool Page**
- User sees overview of WA Sender
- Feature list: bulk messaging, Excel integration, auto-save
- Prominent blue "Get Started" CTA button

**Expected**: User clicks "Get Started" → Redirected to `/auth/signup`

**Screen 3: Signup Page (Modernized)**

**Visual Elements:**
- Light background (#fafafa)
- Navigation bar fixed at top (consistent with homepage)
- Two-column layout (desktop):
  - **Left column**: Brand messaging
    - h1: "Join WA Sender"
    - p: "Send bulk WhatsApp & Email messages at scale"
    - Subtext: "Free forever for first 100 messages"
    - Feature list (3 items):
      - ✓ Auto-detect Excel columns
      - ✓ Send at your own pace
      - ✓ Progress auto-saved
  - **Right column**: Signup form
    - Form card (white, subtle shadow, rounded)
    - Email label + input field
    - Password label + input field (with "show/hide" toggle)
    - Confirm password label + input field
    - Privacy checkbox + link
    - Blue primary button: "Create Account"
    - Footer text: "Already have an account? Log in"

**User Actions:**
1. Enters email address
   - **Validation**: Real-time format check (regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`)
   - If invalid: Red border + error message "Please enter a valid email"
   - If valid: Green checkmark (optional)

2. Enters password
   - **Validation**: Length ≥8 characters
   - If invalid: Red border + error message "Password must be at least 8 characters"
   - Shows password strength indicator (optional):
     - Weak (red): 8-10 chars
     - Fair (yellow): 11-12 chars
     - Strong (green): 13+ chars with mixed case/numbers

3. Confirms password
   - **Validation**: Must match password field
   - If invalid: Red border + error message "Passwords do not match"

4. Reviews privacy checkbox
   - Required field (red asterisk)
   - Text: "I agree to the [Privacy Policy](link) and [Terms](link)"
   - Unchecked by default

5. Clicks "Create Account" button
   - **Loading state**: Button shows spinner, text fades
   - **Backend**: POST /api/auth/signup with email, password
   - **Validation**: 
     - Email uniqueness check
     - Password strength verification
   - **Possible outcomes**:

     **Success**: 
     - User sees success message: "Account created! Redirecting to WA Sender..."
     - Spinner completes with checkmark animation
     - After 2 seconds: Redirect to `/tools/wa-sender` (logged in)

     **Error - Email exists**:
     - Red error banner appears at top of form
     - Message: "This email is already registered. [Log in instead](link)"
     - Focus returns to email field
     - Button re-enables

     **Error - Server error**:
     - Red error banner: "Something went wrong. Please try again."
     - Button re-enables
     - User can retry

**Responsive behavior (mobile):**
- Stacks to single column
- Left column (messaging) moves above form
- Form expands to full width with 16px padding
- Input fields stack vertically
- Button becomes full-width
- Font sizes scale via clamp() for readability

---

## Flow 2: Returning User Sign In

### Context
User already has account, returns to website, wants to access WA Sender tool.

### Storyboard

**Screen 1: Homepage**
- User navigates to topaitoolrank.com
- Sees homepage with navigation bar

**Option A: Direct Navigation**
- User clicks navbar "Tools" → "WA Sender"
- If already logged in: Redirects to `/tools/wa-sender`
- If not logged in: Redirects to `/auth/login` (next screen)

**Option B: Deep Link**
- User has old link to `/tools/wa-sender`
- If logged in: Loads tool directly
- If not logged in: Redirects to `/auth/login` with return URL

**Screen 2: Login Page (Modernized)**

**Visual Elements:**
- Light background (#fafafa)
- Navigation bar fixed at top
- Two-column layout (desktop):
  - **Left column**: Brand messaging
    - h1: "Welcome Back"
    - p: "Continue sending bulk messages with WA Sender"
    - Subtext: "Sign in to your account"
    - Optional: Logo/icon of WA Sender
  - **Right column**: Login form
    - Form card (white, subtle shadow, rounded)
    - Email label + input field
    - Password label + input field
    - "Forgot password?" link (right-aligned)
    - Blue primary button: "Sign In"
    - Footer text: "Don't have an account? [Sign up](link)"

**User Actions:**

1. Enters email address
   - Input field pre-filled if remembered by browser
   - No validation error (email validation happens on submit)

2. Enters password
   - Field is hidden by default (dots/bullets)
   - Optional: Eye icon to toggle show/hide
   - No validation error (password validated on submit)

3. Clicks "Forgot password?" link (optional)
   - Navigates to password reset flow (separate flow)
   - Covered in separate document

4. Clicks "Sign In" button
   - **Loading state**: Button shows spinner, text fades
   - **Backend**: POST /api/auth/login with email, password
   - **Server validation**:
     - User exists
     - Password matches
     - Account not suspended
   - **Possible outcomes**:

     **Success**:
     - Spinner completes with checkmark animation
     - Success message: "Signed in! Redirecting to WA Sender..."
     - Stores tokens in localStorage:
       - `wa-sender-access-token`
       - `wa-sender-refresh-token`
       - `wa-sender-user-id`
       - `wa-sender-user-email`
     - After 2 seconds: Redirect to `/tools/wa-sender` (with user context)

     **Error - Wrong password**:
     - Red error banner appears at top of form
     - Message: "Invalid email or password"
     - Button re-enables
     - Clears password field (for security)
     - Focus returns to email field

     **Error - Account doesn't exist**:
     - Same red error banner: "Invalid email or password"
     - (Doesn't reveal if email exists)
     - Button re-enables

     **Error - Account suspended**:
     - Red error banner: "Your account has been suspended. Contact support."
     - Link to support: "Contact support"
     - Button disabled (can't retry)

     **Error - Server error**:
     - Red error banner: "Something went wrong. Please try again."
     - Button re-enables
     - User can retry

**Responsive behavior (mobile):**
- Single column layout
- Left column content moves above form
- Form full-width with 16px padding
- Input fields stack vertically
- Button full-width
- Touch-friendly target sizes (44×44px minimum)

---

## Flow 3: Reset Forgotten Password

### Context
User forgot password, wants to reset it.

### Storyboard

**Screen 1: Login Page**
- User clicks "Forgot password?" link

**Screen 2: Password Reset Email Entry**
- h1: "Reset Password"
- p: "Enter your email address and we'll send you a link to reset your password"
- Email input field
- Blue button: "Send Reset Link"

**User Actions:**
1. Enters email address
2. Clicks "Send Reset Link"
   - **Loading state**: Spinner on button
   - **Backend**: POST /api/auth/forgot-password with email
   - **Server checks**: Email exists in system
   - **Response**: (Always returns success message, whether email exists or not, for security)

**Screen 3: Confirmation Message**
- Green success banner: "Check your email for reset link"
- p: "We've sent a password reset link to [email]"
- p: "The link expires in 1 hour"
- CTA button: "Back to Login"
- Help text: "Didn't receive email? Check spam folder or [contact support](link)"

**Screen 4: Email Received**
- User receives email titled: "Reset Your WA Sender Password"
- Email contains:
  - Link: https://topaitoolrank.com/auth/reset?token=XXX
  - Expiry: "This link expires in 1 hour"
  - Security note: "If you didn't request this, ignore this email"

**Screen 5: Password Reset Form**
- h1: "Create New Password"
- p: "Enter a new password for your account"
- Password input field
- Confirm password input field
- Blue button: "Update Password"

**User Actions:**
1. Enters new password (with validation as in signup flow)
2. Confirms password
3. Clicks "Update Password"
   - **Backend**: POST /api/auth/reset with token, new password
   - **Validation**:
     - Token is valid and not expired
     - Passwords match
     - Password meets strength requirements

     **Success**:
     - Green success message: "Password updated successfully!"
     - Spinner completes with checkmark
     - After 2 seconds: Redirect to `/auth/login`
     - Message: "You can now sign in with your new password"

     **Error - Token expired**:
     - Red error banner: "This reset link has expired"
     - CTA: "Request new reset link"
     - Redirects to password reset email entry (Flow 3, Screen 2)

     **Error - Passwords don't match**:
     - Red error under confirm field: "Passwords do not match"
     - Focus to confirm field
     - Button stays enabled

---

## Accessibility Features

### All Screens

**Navigation:**
- Keyboard users can Tab through all form fields and buttons
- Tab order is logical (email → password → remember/forgot → button)
- Shift+Tab goes backward

**Focus Indicators:**
- Every interactive element has visible focus outline (2px blue)
- Outline has 2px offset from element

**Form Labels:**
- Every input field has associated `<label>` element
- `<label for="email">` connected to `<input id="email">`
- Clicking label focuses/activates input field

**Required Fields:**
- Marked with red asterisk in label
- Have `required` HTML attribute
- Error messages reference field name clearly

**Error Messages:**
- Appear in red banner at top of form
- Also inline below form fields if relevant
- Associated with input via `aria-describedby`
- Screen readers announce errors immediately

**Screen Reader Announcements:**
- Form submission status announced via `aria-live="polite"` region
- "Loading..." → "Signed in successfully"
- Errors announced with prefix: "Error: Invalid email or password"

**Color Not Alone:**
- Red borders + error message (not just red color)
- Green checkmarks + success message
- Supports colorblind users

**Loading States:**
- Spinner animation has `role="status"` with `aria-live="polite"`
- Announces: "Loading, please wait"
- Completes with checkmark: "Success"

---

## Performance & User Experience

### Form Responsiveness
- Email field validates format on blur (not keystroke)
- Password strength updates on change (real-time feedback)
- Debounced validation (no jank during typing)

### Error Recovery
- Form never loses user input on error
- Clears only sensitive fields (password) on authentication failure
- Provides clear next steps ("Check spam" for reset email)

### Mobile Experience
- Touch targets are 44×44px minimum
- Input fields are legible (no zoom on focus)
- Form scrolls if content exceeds viewport
- Keyboard doesn't obscure important elements

### Success Feedback
- Visual confirmation (spinner → checkmark)
- Toast or banner message
- 2-second delay before redirect (allows user to read message)
- Redirect happens in background (user sees transition)

