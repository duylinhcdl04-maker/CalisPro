# CALISHEALTH — FRONTEND PRODUCT & UI/UX DESIGN SPECIFICATION

You are a senior Product Designer, UX Engineer and React Frontend Architect.

Your task is to design and implement a premium, modern, production-ready frontend for a web application called **CalisHealth**.

CalisHealth is an AI-powered calisthenics and fitness coaching platform.

The product helps users:

1. Create an account.
2. Complete an initial physical and fitness assessment.
3. Build a personalized fitness profile.
4. Receive a personalized calisthenics workout plan.
5. Complete workouts.
6. Track exercise performance.
7. Track progress over time.
8. Receive AI-powered coaching and recommendations.
9. Periodically reassess their condition.
10. Adapt their workout plan based on their progress and recovery.

The application must feel like a combination of:

* Premium fitness application
* Modern health-tech product
* AI coaching platform
* Professional SaaS dashboard

Do NOT make it look like a generic gym website.

The UI should communicate:

* Trust
* Scientific / data-driven training
* Personalization
* Performance
* Progress
* Simplicity
* Modern technology

---

# 1. TECHNOLOGY STACK

---

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Motion / Framer Motion
* Recharts
* React Hook Form
* Zod
* React Router
* TanStack Query
* Axios
* Sonner
* date-fns
* clsx
* tailwind-merge

Do not introduce unnecessary UI libraries.

Use shadcn/ui components as the base UI system, but customize them heavily to create a unique CalisHealth visual identity.

Use semantic HTML and accessible components.

The frontend must be responsive across:

* Desktop
* Laptop
* Tablet
* Mobile

Desktop should be the primary design target.

---

# 2. DESIGN DIRECTION

---

Create a premium minimalist fitness/health-tech visual language.

Avoid:

* Generic gym aesthetics
* Excessive gradients
* Neon colors
* Overly aggressive bodybuilding visuals
* Excessive glassmorphism
* Excessive rounded cards
* Excessive shadows
* Cluttered dashboards
* Too many colors
* Cartoon-like illustrations

Use:

* Strong typography
* Generous whitespace
* Clear hierarchy
* Subtle borders
* Soft elevation
* Clean data visualization
* High-quality exercise imagery
* Subtle motion
* Strong CTA hierarchy

The interface should feel calm, intelligent and performance-oriented.

The design should communicate:

"CalisHealth understands your body and helps you improve."

---

# 3. COLOR SYSTEM

---

Create a complete design token system.

Primary:

Deep charcoal / near-black.

Secondary:

Neutral gray scale.

Accent:

Use a sophisticated green or emerald tone associated with health, progress and performance.

Example conceptual palette:

Primary:
#111111

Background:
#F7F8F6

Surface:
#FFFFFF

Border:
#E5E7E3

Text Primary:
#171817

Text Secondary:
#6B716B

Accent:
#4F7F61

Accent Soft:
#EAF2EC

Success:
#4F7F61

Warning:
#C28A35

Danger:
#B85C5C

Do not hard-code these values everywhere.

Create CSS variables/design tokens.

Support dark mode architecturally, even if the first release is light mode.

---

# 4. TYPOGRAPHY

---

Use a modern professional sans-serif font.

Preferred:

Inter

or

Manrope

Typography hierarchy:

Display:
48–64px

H1:
40–48px

H2:
32–40px

H3:
24–28px

Body:
15–17px

Small:
13–14px

Use font-weight strategically.

Avoid excessive bold text.

Use typography to establish hierarchy rather than relying on colors.

---

# 5. GLOBAL LAYOUT

---

Create:

PublicLayout
AuthenticatedLayout
OnboardingLayout

Public pages should use a clean top navigation.

Authenticated pages should use:

Desktop:
Left sidebar + main content

Mobile:
Bottom navigation or compact mobile navigation.

Authenticated sidebar:

Home
Workout
Progress
Exercises
Assessment
Profile

Sidebar should show:

CalisHealth logo
Navigation
Current training goal
User avatar
Settings

Keep navigation visually minimal.

---

# 6. PUBLIC HOME PAGE

---

Route:

/

This page is visible before authentication.

IMPORTANT:

The public Home must NOT show:

* Fitness score
* Personal workout
* User progress
* Personal records
* AI recommendations
* Personal health information

because the visitor is not authenticated.

The public Home should explain the product.

---

# 7. PUBLIC HOME STRUCTURE

---

## HEADER

Logo:

CalisHealth

Navigation:

How it works
Exercises
About

Actions:

Login
Get Started

Desktop header:

* Maximum width around 1200–1280px
* Sticky or semi-sticky
* Transparent/white background
* Subtle bottom border on scroll

Mobile:

Logo
Menu button

---

# 8. HERO SECTION

---

Hero headline:

"Train smarter.
Understand your body.
Build your strength."

Supporting text:

"CalisHealth creates personalized calisthenics training based on your fitness level, goals, performance and progress."

Primary CTA:

"Get Started"

Secondary CTA:

"How It Works"

Hero should include a high-quality visual representing:

* Calisthenics movement
* Human body
* Training
* Movement analysis

Do not use cheesy gym stock photography.

Prefer:

* Editorial fitness photography
* Minimal athlete photography
* High-quality motion image
* Abstract body/movement visualization

The visual should feel premium and technical.

---

# 9. HOW CALISHEALTH WORKS

---

Create a 5-step section.

Step 1:

Assess

"Understand your current fitness level."

Step 2:

Personalize

"Build a training plan around your goals."

Step 3:

Train

"Follow structured calisthenics workouts."

Step 4:

Track

"Measure your performance and progress."

Step 5:

Improve

"Adapt your training using data and AI."

Use a horizontal timeline on desktop.

Use vertical cards on mobile.

Add subtle scroll animation.

---

# 10. VALUE PROPOSITION

---

Create three feature cards:

Personalized Training

"Training designed around your body and goals."

AI Coaching

"Get intelligent feedback based on your performance."

Progress Tracking

"Understand how your strength and fitness improve over time."

Use Lucide icons.

Avoid huge decorative icons.

---

# 11. FINAL CTA

---

Section:

"Your training should evolve with you."

Supporting text:

"Start with a simple assessment and get a personalized training experience."

CTA:

"Create Your Account"

---

# 12. REGISTER PAGE

---

Route:

/register

Design:

Centered authentication card.

Fields:

Email
Password
Confirm Password

Checkbox:

Terms & Privacy Policy

Primary button:

Create Account

Secondary:

Already have an account? Log in

Use:

React Hook Form
Zod

Validation must be clear and inline.

Use subtle animations for validation states.

Do not use intrusive alerts.

---

# 13. LOGIN PAGE

---

Route:

/login

Fields:

Email
Password

Actions:

Login
Forgot password
Create account

After successful login:

IMPORTANT BUSINESS RULE:

The backend returns onboarding status.

Example:

{
"onboarding": {
"status": "NOT_STARTED"
}
}

If onboarding is NOT_COMPLETED:

Redirect to:

/onboarding

If onboarding is COMPLETED:

Redirect to:

/home

Do not redirect every user to the same page.

---

# 14. FIRST LOGIN ONBOARDING

---

This is one of the most important experiences in the application.

A newly registered user should NOT immediately see the normal dashboard.

After their first successful login:

Login
↓
Check onboarding status
↓
If not completed
↓
Show assessment

Route:

/onboarding

The onboarding should feel like a premium guided experience rather than a boring form.

---

# 15. ONBOARDING DESIGN

---

Use a clean full-page layout.

Top:

CalisHealth logo

Progress indicator:

Step 1 of 5

Progress bar

Main content:

Question

Answer controls

Bottom:

Back
Next

Example:

"What is your primary goal?"

Options:

Build Strength
Build Muscle
Lose Weight
Improve Endurance
Learn Calisthenics Skills
General Fitness

Each option should be a selectable card.

Selected state:

* Accent border
* Soft accent background
* Check icon

Use Motion for subtle selection animation.

---

# 16. ASSESSMENT STEPS

---

Create approximately 5 logical sections.

STEP 1 — Basic Information

Age
Gender
Height
Weight

STEP 2 — Goals

Primary goal
Secondary goal

STEP 3 — Training Experience

Beginner
Intermediate
Advanced

STEP 4 — Physical Performance

Maximum Push Ups
Maximum Pull Ups
Maximum Squats
Plank Duration

STEP 5 — Lifestyle / Availability

Training days per week
Sleep duration
Training preference

The questionnaire must be data-driven.

Do NOT hard-code all questions directly into React components.

Create reusable question components:

QuestionRenderer
SingleChoiceQuestion
MultipleChoiceQuestion
NumberQuestion
BooleanQuestion
ScaleQuestion

The backend should provide question metadata.

---

# 17. ONBOARDING COMPLETION

---

After the user completes the assessment:

Show a short processing screen.

Example:

"Analyzing your profile..."

Animation:

Subtle progress animation.

Then:

"Your training profile is ready."

Display:

Fitness Level
Primary Goal
Training Frequency

Then CTA:

"View My Training Plan"

Redirect:

/home

---

# 18. AUTHENTICATED HOME

---

Route:

/home

This is the user's personal dashboard.

The page should answer:

1. What should I do today?
2. How am I doing?
3. Am I improving?
4. What does my AI coach recommend?

---

# 19. HOME STRUCTURE

---

Top:

"Good morning, {firstName} 👋"

Supporting text:

"Ready for today's training?"

Show primary goal:

"Current goal: Build Strength"

---

# 20. TODAY'S WORKOUT

---

This must be the most visually important component.

Example:

TODAY'S WORKOUT

Upper Body Strength

5 Exercises
35 min
Intermediate

Push
Pull
Core

Primary CTA:

Start Workout

If workout already started:

Continue Workout

If rest day:

REST DAY

"Recovery is part of progress."

CTA:

View Recovery

---

# 21. FITNESS STATUS

---

Display:

Fitness Score

72 / 100

Then:

Strength
78

Endurance
64

Mobility
61

Core
75

Balance
58

Use a clean radial chart or segmented visualization.

Do not make it look like a gaming dashboard.

---

# 22. TRAINING SUMMARY

---

Create four compact cards:

Workouts this week

3 / 4

Training time

185 min

Current streak

7 days

Completion rate

82%

Use data from workout sessions.

---

# 23. READINESS

---

Show:

Today's Readiness

78 / 100

Metrics:

Energy
Sleep
Muscle soreness
Stress

Example message:

"You're ready for a normal training session."

If readiness is low:

"Your recovery is lower than usual. Consider a lighter session."

This section must never make medical diagnoses.

---

# 24. PROGRESS

---

Create a large progress chart.

Default metric:

Strength

Allow switching:

Strength
Endurance
Mobility
Push Up
Pull Up
Plank

Use Recharts.

Chart style:

Minimal
Thin lines
Subtle grid
Clear tooltip
No excessive decoration

Time ranges:

7D
30D
3M
6M
1Y

---

# 25. PERSONAL RECORDS

---

Display:

Push Up
30 reps

Pull Up
8 reps

Plank
2:15

Use compact cards.

Include trend indicators.

---

# 26. AI COACH

---

Create a visually distinct but minimal AI Coach card.

Example:

AI COACH

"Your push-up performance improved 12% over the last 3 weeks.

Your mobility score has remained almost unchanged.

I recommend adding two mobility sessions this week."

CTA:

View Recommendation

The AI card should feel intelligent, not gimmicky.

Do NOT use a humanoid robot illustration.

Use a subtle AI/motion icon.

---

# 27. RECOMMENDED EXERCISES

---

Display 3–4 exercise cards.

Each card:

Exercise image
Exercise name
Difficulty
Target muscle
Short description

Example:

Push Up
Beginner
Chest • Triceps

Button:

View Exercise

---

# 28. EMPTY STATES

---

Every major component must have a meaningful empty state.

Examples:

No workout:

"No workout scheduled today."

No progress:

"Complete a few workouts to start seeing your progress."

No assessment:

"Complete your assessment to unlock personalized training."

No personal records:

"Your first personal record will appear here."

Do not show empty white boxes.

---

# 29. LOADING STATES

---

Use skeleton loaders.

Do not show:

"Loading..."

everywhere.

Create reusable:

CardSkeleton
ChartSkeleton
WorkoutSkeleton
ProfileSkeleton

Use shimmer very subtly.

---

# 30. ERROR STATES

---

Use friendly error states.

Example:

"We couldn't load your workout."

Button:

Try Again

Use Sonner only for lightweight notifications.

Do not use browser alerts.

---

# 31. WORKOUT PAGE

---

Route:

/workout/:id

Show:

Workout name
Estimated duration
Difficulty
Muscle groups
Exercise list

Each exercise:

Exercise image
Name
Sets
Reps
Rest
RPE

Primary:

Start Workout

---

# 32. ACTIVE WORKOUT UI

---

When workout starts:

Show:

Current exercise

Push Up

Set 2 / 3

12 reps

Rest timer

Next exercise

Progress bar

Controls:

Complete Set
Skip
Pause Workout
Finish Workout

The interface should prioritize focus.

Remove unnecessary navigation while exercising.

---

# 33. EXERCISE DETAIL

---

Route:

/exercises/:id

Show:

Large exercise visual

Exercise name

Difficulty

Primary muscles

Secondary muscles

Instructions

Safety notes

Progression:

Previous exercise
Current exercise
Next progression

Example:

Knee Push Up
↓
Push Up
↓
Diamond Push Up
↓
Archer Push Up

This should visually communicate the progression path.

---

# 34. PROGRESS PAGE

---

Route:

/progress

Sections:

Overall progress
Fitness score
Strength
Endurance
Mobility
Workout consistency
Personal records
Body measurements

Use:

Recharts
Cards
Timeline
Comparison states

Example:

"Strength +18% since initial assessment."

---

# 35. ASSESSMENT HISTORY

---

Route:

/assessment

Show:

Initial Assessment
September 2026

Periodic Assessment
October 2026

Compare:

Strength
Endurance
Mobility
Core

Allow users to see how their fitness profile changes over time.

---

# 36. PROFILE PAGE

---

Route:

/profile

Sections:

Personal information
Goals
Training preferences
Account
Privacy
Consent
Sessions

Actions:

Edit profile
Change password
Logout

---

# 37. RESPONSIVE DESIGN

---

Desktop:

1200–1440px content width.

Tablet:

Collapse sidebar.

Mobile:

Use bottom navigation:

Home
Workout
Progress
Exercises
Profile

Cards should stack vertically.

Workout CTA should become sticky on mobile.

Charts must remain readable.

Do not simply shrink desktop UI.

Actually redesign the information hierarchy for mobile.

---

# 38. ANIMATION SYSTEM

---

Use Motion.

Animations should be subtle.

Use:

Fade in
Slide up
Scale
Layout transitions
Progress animation
Button feedback
Card hover

Avoid:

Huge animations
Continuous animations
Excessive parallax
Distracting background animations

Animation duration:

150–350ms for UI interaction.

Use staggered animation only for important sections.

---

# 39. ACCESSIBILITY

---

Follow WCAG principles.

Ensure:

Keyboard navigation
Visible focus states
ARIA labels
Accessible dialogs
Accessible forms
Readable contrast
Semantic headings
Accessible buttons

Do not rely only on color to communicate status.

---

# 40. COMPONENT ARCHITECTURE

---

Organize code approximately:

src/

components/
ui/
layout/
navigation/
workout/
assessment/
progress/
fitness/
coach/
exercise/

pages/
public/
auth/
onboarding/
app/

features/
auth/
assessment/
workout/
progress/
exercises/
profile/

hooks/

lib/
api/
utils/

types/

services/

Use feature-oriented architecture where appropriate.

Avoid putting all components in one folder.

---

# 41. API ARCHITECTURE

---

Prepare the frontend for Spring Boot REST APIs.

Base URL:

/api/v1

Authentication:

JWT Bearer token.

Expected APIs:

POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout

GET /me

GET /home

GET /assessment/questions
POST /assessment/sessions
POST /assessment/sessions/{id}/responses
POST /assessment/sessions/{id}/complete

GET /fitness-profile

GET /workout/today
GET /workout/plans
GET /workout/plans/{id}
POST /workout/sessions
POST /workout/sessions/{id}/sets
POST /workout/sessions/{id}/complete

GET /progress
GET /progress/metrics
GET /progress/personal-records

GET /exercises
GET /exercises/{id}

GET /recommendations
GET /recommendations/latest

GET /profile
PUT /profile

Use TanStack Query for server state.

Do not put server data directly into local component state unless necessary.

---

# 42. HOME API MODEL

---

The Home page should consume one aggregated endpoint:

GET /api/v1/home

Example response:

{
"user": {
"name": "Min",
"avatarUrl": null
},

"primaryGoal": {
"code": "STRENGTH",
"name": "Build Strength"
},

"today": {
"type": "WORKOUT",
"workoutPlanId": 12,
"dayId": 34,
"name": "Upper Body Strength",
"durationMinutes": 35,
"exerciseCount": 5,
"status": "NOT_STARTED"
},

"fitness": {
"overallScore": 72,
"strength": 78,
"endurance": 64,
"mobility": 61,
"core": 75,
"balance": 58
},

"weeklySummary": {
"completedWorkouts": 3,
"plannedWorkouts": 4,
"totalMinutes": 185,
"streak": 7
},

"readiness": {
"score": 78,
"energy": 8,
"sleepHours": 7.5,
"soreness": 3,
"stress": 4
},

"progress": {},

"personalRecords": [],

"coach": {}
}

---

# 43. AUTHENTICATION FLOW

---

Implement:

Register
↓
Login
↓
Receive JWT
↓
Check onboarding status

If:

NOT_STARTED
or
IN_PROGRESS

redirect:

/onboarding

If:

COMPLETED

redirect:

/home

Do not rely only on localStorage to determine onboarding state.

The backend is the source of truth.

---

# 44. DATA STATES

---

Every page must support:

Loading
Success
Empty
Error

The UI must be designed for all four states.

---

# 45. DESIGN QUALITY BAR

---

The final result should look like a professionally designed startup product.

Do not generate:

* Generic dashboard templates
* Default Bootstrap-like UI
* Excessively rounded cards
* Excessive shadows
* Random gradients
* Random colors
* Huge text everywhere
* Unnecessary badges
* Fake statistics
* Fake user data in production components

Use realistic placeholder data only in development/demo mode.

---

# 46. IMPORTANT BUSINESS RULES

---

RULE 1:

Unauthenticated users see Public Home.

RULE 2:

New users must register before accessing personalized features.

RULE 3:

After registration, user logs in.

RULE 4:

After first login, backend onboarding status is checked.

RULE 5:

If onboarding is incomplete, user is redirected to onboarding/assessment.

RULE 6:

User cannot see personalized Home before completing the initial assessment.

RULE 7:

After completing assessment:

Assessment
→ Fitness Profile
→ Recommendation
→ Workout Plan
→ Personalized Home

RULE 8:

Returning users with completed onboarding go directly to Home.

RULE 9:

If onboarding is IN_PROGRESS, resume the assessment from the current step.

RULE 10:

Never create fake fitness data just to populate the dashboard.

---

# 47. IMPLEMENTATION ORDER

---

Build in this order:

PHASE 1

Design system
Global styles
Typography
Colors
Buttons
Cards
Inputs
Navigation

PHASE 2

Public Home

PHASE 3

Register
Login
Authentication state

PHASE 4

Onboarding
Assessment

PHASE 5

Authenticated Home

PHASE 6

Workout

PHASE 7

Exercise Library

PHASE 8

Progress

PHASE 9

Profile

PHASE 10

AI Coach UI

---

# 48. FINAL REQUIREMENT

---

Before writing code:

1. Analyze the requirements.
2. Create the component hierarchy.
3. Create the routing structure.
4. Create the design token system.
5. Create reusable UI primitives.
6. Create responsive layouts.
7. Then implement pages.

Do not create every page as an isolated design.

The entire application must feel like one coherent product.

The final visual direction should feel:

Premium
Minimal
Scientific
Human
Calm
Athletic
Intelligent

The most important UX principle is:

"Show the user what matters now, then help them understand why."

Do not overwhelm users with data.

Prioritize:

Today's action
Current condition
Progress
Next recommendation
