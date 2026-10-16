# Calisthenics Platform — Frontend Base

A React + TypeScript + Vite + Tailwind CSS frontend foundation for a personalized calisthenics platform.

## Included

- Premium landing / onboarding experience
- Initial assessment flow
- Experience assessment
- Goal selection
- Physical capacity assessment
- Training knowledge assessment
- Initial profile result
- Responsive sidebar/dashboard shell
- Evidence-informed product positioning
- Clean design system ready for API integration

## Run

```bash
npm install
npm run dev
```

## Next architecture steps

Suggested frontend domains:

- `features/onboarding`
- `features/assessment`
- `features/profile`
- `features/exercises`
- `features/program`
- `features/workout`
- `features/progress`
- `features/knowledge`

Recommended backend integration:

- `POST /api/assessment/sessions`
- `GET /api/assessment/protocols/initial`
- `POST /api/assessment/sessions/{id}/answers`
- `POST /api/assessment/sessions/{id}/results`
- `POST /api/profile/generate`
- `GET /api/training-path`
- `GET /api/program/current`

The current UI intentionally uses mock data so the product flow can be designed before API contracts are finalized.
