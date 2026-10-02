# STUDENT PROJECT TEMPLATE (SRS)

*(INSTRUCTION FOR STUDENTS: THIS DOCUMENT SERVES AS THE FORMAL 'CONTRACT' FOR YOUR TEAM PROJECT. IT MUST BE MAINTAINED IN YOUR GITHUB REPOSITORY.)*

# beatBound

## SOFTWARE REQUIREMENTS SPECIFICATION

**INSTRUCTOR:** LARA NICHOLS-BROWN
**TERM:** FALL 2026
**SECTION:** 3

**THE ENGINEERING TEAM:**

1. STUDENT A: Amogh Arora — Lead Engineer
2. STUDENT B: Grigory Polunin — Scrum Master
3. STUDENT C: Edgar Olozagaste-Olea — Product Owner

**PROJECT ASSETS:**

- GITHUB: https://github.com/Grigory-CP/beatBound
- DEPLOYMENT: [LINK TO LIVE SITE]

**DOCUMENT HISTORY:**

| LAST DATE CHANGED | WHO | WHAT WAS CHANGED |
|---|---|---|
| 9/25/2026 | Amogh Arora | Initial draft: product vision, Amogh's user stories, and related functional/non-functional requirements (TE2) |
| 9/25/2026 | Edgar Olozagaste-Olea | Added 3 user stories along with corresponding functional requirements for TE2. |
| 9/25/2026 | Grigory Polunin | Added 3 user stories along of functional requirements for TE2. |
| 10/1/2026 | Edgar Olozagaste-Olea | Added Section 5.3, Technology Stack: Music Functionality (Pitchy, Web Audio API, Tone.js, VexFlow). |
| 10/1/2026 | [NAME] | Aligned scope, user stories, functional requirements, and NFRs with the updated UML: removed assignments, teacher-created challenges, department head, songs, and note-reading; added student reports, friends, leaderboards, parent monitoring, and game settings. Described UML diagrams in 5.3. |

---

# beatBound

## SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

**COURSE:** CSC 3100-03
**DATE:** [SUBMISSION DATE]

---

## TABLE OF CONTENTS

1. INTRODUCTION ........................................ [PAGE #]
   - 1.1 PROJECT PURPOSE
   - 1.2 INTENDED AUDIENCE
   - 1.3 PROJECT SCOPE
2. USER STORIES ........................................ [PAGE #]
   - 2.1 USER FEATURES (THE "SHALL" STATEMENTS)
   - 2.2 ADMIN FEATURES
3. FUNCTIONAL REQUIREMENTS ........................................ [PAGE #]
4. NON-FUNCTIONAL REQUIREMENTS ........................................ [PAGE #]
   - 4.1 DATA INTEGRITY & SECURITY
   - 4.2 PERFORMANCE & USABILITY
5. SYSTEM ARCHITECTURE ........................................ [PAGE #]
   - 5.1 REST API ENDPOINTS
   - 5.2 DATABASE SCHEMA (MYSQL)
   - 5.3 UMLs
   - 5.4 TECHNOLOGY STACK: MUSIC FUNCTIONALITY
6. USER INTERFACE (UI) ........................................ [PAGE #]
   - 6.1 WIREFRAMES / MOCKUPS
7. DATA REQUIREMENTS ........................................ [PAGE #]
   - 7.1 LIST OF PERSISTENT DATA
8. TRACEABILITY MATRIX ........................................ [PAGE #]
9. APPENDICES ........................................ [PAGE #]

---

## 1. INTRODUCTION

- **PROBLEM STATEMENT:** Music practice built around repetitive drills (scales, pitch-matching, note-reading) is low-engagement for kids and young teens, and most practice apps aren't built for a teacher managing a whole class at once.
- **TARGET AUDIENCE:** Kids and young teens learning music, and the music teachers who instruct them.
- **SCOPE:** An MVP singing-and-rhythm RPG where students battle enemies via pitch-matching and rhythm challenges, plus a classroom layer where teachers and parents monitor student progress (class codes, rosters, progress reports), a student-only friends system, and classroom and global leaderboards. Out of scope for MVP: multiplayer battles, note-reading challenges, teacher-created challenges, app store deployment, monetization, full curriculum library.
- **PRODUCT VISION:** For kids and young teens who want music practice to feel like an adventure instead of a chore, beatBound is a singing-and-rhythm RPG that turns vocal pitch-matching and rhythm drills into monster-battling gameplay, with a teacher dashboard that lets instructors organize classes and track student progress. Unlike drill-based ear-training apps (e.g., Yousician, Simply Piano) or generic rhythm games (e.g., Beat Saber, Just Dance), beatBound combines RPG-style progression with classroom management tools built specifically for group music education.

| TEMPLATE ELEMENT | CONTENT |
|---|---|
| Target customer | Kids and young teens, and the music teachers who instruct them |
| Need / opportunity | Music practice is repetitive and low-engagement as drills, and existing apps aren't built for classroom use |
| Product name | beatBound |
| Product category | A singing-and-rhythm RPG with a teacher-managed classroom layer |
| Key benefit | Turns individual practice into game progression, while giving teachers tools to organize and monitor a whole class |
| Primary competitive alternative | Drill-based ear-training/vocal apps (Yousician, Simply Piano) and generic rhythm games (Beat Saber, Just Dance) |
| Primary differentiation | Combines RPG progression with built-in classroom management (rosters, class codes, progress dashboards) that neither alternative offers |

---

## 2. USER STORIES

USER STORIES FOLLOW THE FORMAT: "AS A [TYPE OF USER], I WANT TO [ACTION] SO THAT [VALUE/BENEFIT]."

- US-01: REAL-TIME PITCH FEEDBACK
- US-02: RHYTHM/PITCH BATTLES
- US-03: CHARACTER PROGRESSION

| ID | Requirement | Priority | Author |
|---|---|---|---|
| US-01 | As a student, I want to sing into my microphone and get real-time feedback on my pitch accuracy so that I know whether I'm hitting the right notes during a battle. | 1 | Amogh Arora |
| US-02 | As a student, I want to battle monsters by completing rhythm and pitch-matching challenges so that practicing music feels like playing a game instead of a chore. | 1 | Amogh Arora |
| US-03 | As a student, I want my character to level up and unlock new challenges as I improve so that I stay motivated to keep practicing. | 2 | Amogh Arora |
| US-04 | As a teacher, I want to be able to provide my students with unique class codes to join my classroom so that I may be able to monitor their progress. | 1 | Edgar Olozagaste-Olea |
| US-05 | As a student, I want to be able to pause and resume my challenges so that I do not lose progress if I am interrupted. | 2 | Edgar Olozagaste-Olea |
| US-06 | As a teacher, I want to see which challenges my students struggle with the most so that I can focus my support where it is needed. | 3 | Edgar Olozagaste-Olea |
| US-07 | As a teacher, I want to view progress reports for my classroom and for each student so that I can monitor engagement and discuss progress with parents. | 1 | Grigory Polunin |
| US-08 | As a teacher, I want an engaging, but distraction free platform from my students to learn, where other app usage can be restricted to maintain student focus. | 2 | Grigory Polunin |
| US-09 | As a parent, I want my child to learn music through interactive approaches, while being able to reduce or disable and control game options, and gambling-like in game features. | 3 | Grigory Polunin |
| US-10 | As a student, I want to send and accept friend requests from other students so that I can connect with friends and stay motivated. | 3 | [AUTHOR] |
| US-11 | As a student, I want to see how I rank among my classmates on a classroom leaderboard so that I feel motivated to improve. | 3 | [AUTHOR] |
| US-12 | As a student, I want my classroom to appear on a global leaderboard so that my class can compete with other classrooms. | 3 | [AUTHOR] |
| US-13 | As a parent, I want to view my child's progress report so that I can follow their practice. | 2 | [AUTHOR] |

---

## 3. FUNCTIONAL REQUIREMENTS

THE SYSTEM SHALL...

| ID | REQUIREMENT | PRIORITY |
|---|---|---|
| FR-01 | Analyze microphone audio input and provide real-time pitch-accuracy feedback during gameplay. | 1 |
| FR-02 | Present rhythm and pitch-matching challenges as "battles" against in-game enemies. | 1 |
| FR-03 | Track player level/progression and unlock new challenges based on performance. | 2 |
| FR-04 | Teacher and student specific sign-up roles. | 1 |
| FR-05 | A classroom providing teachers with oversight of their students. | 1 |
| FR-06 | Pause and resume functionality inside each match. | 2 |
| FR-07 | Stored progress for each specific level. | 2 |
| FR-08 | A classroom report showing teachers each student's progress and the challenges the class struggles with most. | 3 |
| FR-09 | A student-only friends system where students can send, accept, decline, and remove friend requests. | 3 |
| FR-10 | A student report for each student that tracks score, battles won, accuracy, and progress on every level, updated only by that student's own gameplay. | 2 |
| FR-11 | A classroom leaderboard ranking the students in a classroom using their student reports. | 3 |
| FR-12 | A global leaderboard ranking classrooms against each other. | 3 |
| FR-13 | Parent accounts that can be linked to a student and can view that student's report. | 2 |
| FR-14 | Per-student game settings that a parent can use to reduce or disable random-reward features, sound, and daily play time. | 3 |

*(Functional requirement for US-08 is pending a team decision on teacher focus mode.)*

---

## 4. NON-FUNCTIONAL REQUIREMENTS

- **INTEGRITY:** All audio and gameplay data submissions must be validated to handle malformed or unexpected input without crashing gameplay.
- **SECURITY:** IMPLEMENT BCRYPT FOR PASSWORD HASHING AND ENVIRONMENT VARIABLES FOR DB CREDENTIALS. Because primary users are minors, the system should collect minimal personal data. Student accounts require only a display name and teacher-issued class code; an email may be stored for any account but is optional for students. Friends lists and leaderboards display only display names.
- **USABILITY:** Pitch-detection feedback should feel real-time (well under 200ms latency). The student-facing UI must be usable by the target age group, with minimal text, clear icons, and simple navigation; the teacher dashboard should let a teacher check student progress in a few clicks.

---

## 5. SYSTEM ARCHITECTURE

### 5.1 REST ENDPOINTS

(LIST METHOD | URL | DESCRIPTION)

- LIST YOUR PLANNED ENDPOINTS BASED ON YOUR REST SLIDE:
  - GET /API/RESOURCES — FETCHES COLLECTION.
  - POST /API/RESOURCES — CREATES A NEW RESOURCE.

### 5.2 DATABASE SCHEMA

-

### 5.3 UMLs

[ATTACH DIAGRAM IMAGES]

Students are the only role that plays the game. Teachers and parents act as monitors.

1. **Users and classrooms:** `User` is an abstract class extended by `Student`, `Teacher`, and `Parent`. A teacher manages classrooms, a classroom enrolls students, a parent is a guardian of students, and each student has `GameSettings`.
2. **Reports and leaderboards:** Each student owns one `StudentReport`. Each classroom has one `ClassroomReport` that ranks its students' reports. The `GlobalLeaderboard` ranks classrooms. Teachers and parents view reports.
3. **Friends system:** A `Friendship` links two student accounts as requester and addressee, with a status of pending, accepted, or declined.
4. **Progression and levels:** Each `StudentReport` contains one `LevelProgress` per fixed `Challenge`. `Challenge` is abstract and is extended by `PitchChallenge` and `RhythmChallenge`. A student's `Character` has health and experience and unlocks challenges.
5. **Battle:** A student plays `Battle`s. Each battle runs one challenge, pits the student's character against an enemy, uses the `PitchAnalyzer`, tracks a `BattleStatus`, and updates the student's report.

### 5.4 TECHNOLOGY STACK: MUSIC FUNCTIONALITY

#### Pitchy

Pitchy is a lightweight JavaScript library that detects the pitch of a sound in real time, using the McLeod Pitch Method. Given a short chunk of audio samples, it returns the detected frequency in Hz along with a "clarity" value from 0 to 1 that indicates how reliable the reading is. beatBound will use Pitchy to determine which note a student is singing, then compare it against the target note to give real-time accuracy feedback during battles (FR-01). The clarity value will also let us ignore background noise and silence.

#### Web Audio API

The Web Audio API is a browser-native JavaScript API that requires no installation. It has two main roles in beatBound:

- **Input:** It captures the student's microphone audio and passes it to Pitchy for analysis. All audio is processed locally in the browser, and only scores and progress are sent to the server, which supports our requirement to collect minimal data on minors.
- **Output:** It plays audio to the student's browser, including reference tones for pitch challenges, metronome clicks for rhythm challenges, and sound effects for battles.

It also provides the audio clock used to time rhythm challenges, and it supports pausing and resuming audio for the pause feature (FR-06).

The Web Audio API and Pitchy are all that is needed for a working MVP. The following optional libraries could improve both the developer and user experience if time allows.

#### Tone.js (optional)

Tone.js is a library built on top of the Web Audio API that simplifies working with music. It would provide:

- Better-sounding synthesized notes for reference tones.
- Tempo-based scheduling, so rhythm challenges can be defined in BPM and note lengths rather than raw timestamps.
- Easy conversion between note names, MIDI numbers, and frequencies.

It would reduce the amount of custom timing code we have to write, at the cost of a larger bundle size.

#### VexFlow (optional, future)

VexFlow is a library that renders standard music notation (staves, clefs, and notes) in the browser as SVG. It is not needed for the MVP, since note-reading challenges are out of scope. It would become useful if note-reading challenges are added later, to show real sheet music at a higher level of quality than hand-drawn graphics. It only draws the notation. Scoring and answer checking would remain our own game logic.

---

## 6. USER INTERFACE (UI)

### 6.1 WIREFRAMES / MOCKUPS

---

## 7. DATA REQUIREMENTS

---

## 8. TRACEABILITY MATRIX

| ID | REQUIREMENT | LINE OF CODE |
|---|---|---|
| US-01 | The system will authenticate users via username and password. | 152 |
| US-02 | Allow users to store workout information | 256 |
| US-03 | Allow users to search their workout history | 46 |
| US-04 | Allow users to add new workout types. | 45 |

---

## 9. AI USAGE & DISCLOSURE (MANDATORY)

- **MODEL(S) USED:** [E.G., CLAUDE 3.5, GPT-4O]
- **PROMPTS USED DURING CODING:**
