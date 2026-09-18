STUDENT PROJECT TEMPLATE (SRS)
(INSTRUCTION FOR STUDENTS: THIS DOCUMENT SERVES AS THE FORMAL 'CONTRACT' FOR YOUR TEAM PROJECT. IT MUST BE MAINTAINED IN YOUR GITHUB REPOSITORY.)

[INSERT PROJECT NAME HERE]

SOFTWARE REQUIREMENTS SPECIFICATION
INSTRUCTOR: LARA NICHOLS-BROWN
TERM: [E.G., SPRING 2026]
SECTION: [SECTION NUMBER]

THE ENGINEERING TEAM:
1.	STUDENT A: [NAME] — [ROLE, E.G., APP ARCHITECT]
2.	STUDENT B: [NAME] — [ROLE, E.G., API DEVELOPER]
3.	STUDENT C: [NAME] — [ROLE, E.G., SCRUM MASTER]

PROJECT ASSETS:
•	GITHUB: [LINK]
•	DEPLOYMENT: [LINK TO LIVE SITE]

DOCUMENT HISTORY: 	
LAST DATE CHANGED: 	WHO:	WHAT WAS CHANGED:
		
		
		
		

________________________________________ 

[PROJECT TITLE]
SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
COURSE: [COURSE NAME/NUMBER]
DATE: [SUBMISSION DATE]
________________________________________
TABLE OF CONTENTS
1.	INTRODUCTION ...................................................................................... [PAGE #]
O	1.1 PROJECT PURPOSE
O	1.2 INTENDED AUDIENCE
O	1.3 PROJECT SCOPE
2.	USER STOREIES ..................................................................................... [PAGE #]
O	2.1 USER FEATURES (THE "SHALL" STATEMENTS)
O	2.2 ADMIN FEATURES
3.	FUNCTIONAL REQUIREMENTS....................................................... [PAGE #]
4.	NON-FUNCTIONAL REQUIREMENTS ............................................ [PAGE #]
O	4.1 DATA INTEGRITY & SECURITY
O	4.2 PERFORMANCE & USABILITY
5.	SYSTEM ARCHITECTURE ................................................................ [PAGE #]
O	5.1 REST API ENDPOINTS
O	5.2 DATABASE SCHEMA (MYSQL)
6.	USER INTERFACE (UI) ...................................................................... [PAGE #]
O	6.1 WIREFRAMES / MOCKUPS
7.	DATA REQUIREMENTS ..................................................................... [PAGE #]
O	7.1 LIST OF PERSISTENT DATA
8.	TRACEABILITY MATRIX ................................................................. [PAGE #]
9.	APPENDICES ....................................................................................... [PAGE #]
________________________________________

 
1.	INTRODUCTION
•	PROBLEM STATEMENT: WHAT SPECIFIC PROBLEM ARE YOU SOLVING?
•	TARGET AUDIENCE: WHO ARE THE STAKEHOLDERS?
•	SCOPE: WHAT IS THE SCOPE OF THIS PROJECT?
2.	USER STORIES
USER STORIES FOLLOW THE FORMAT: "AS A [TYPE OF USER], I WANT TO [ACTION] SO THAT [VALUE/BENEFIT]."...
•	US-01: AUTHENTICATION
•	US-02: STORE WORKOUT_LOG.
•	US-03: SEARCH HISTORY 
ID	REQUIREMENT	PRIORITY
US-01	As a user, I want to authenticate via username and password.	2
US-02	As a user, I want to store workout information	1
US-03	As a user, I want to search workout history	3
US-04	As a user, I want to add new workout types.	4

3.	FUNCTIONAL REQUIREMENTS
THE SYSTEM SHALL...
ID	REQUIREMENT	PRIORITY
FR-01	The system will authenticate users via username and password.	2
FR-02	Allow users to store workout information	1
US-03	Allow users to search their workout history	3
US-04	Allow users to add new workout types.	4

4. NON-FUNCTIONAL REQUIREMENTS
•	INTEGRITY: HANDLING ERRORS AND BAD DATA
•	SECURITY: IMPLEMENT BCRYPT FOR PASSWORD HASHING AND ENVIRONMENT VARIABLES FOR DB CREDENTIALS.
•	USABILITY: 
5. SYSTEM ARCHITECTURE
•	REST ENDPOINTS: (LIST METHOD | URL | DESCRIPTION)
•	LIST YOUR PLANNED ENDPOINTS BASED ON YOUR REST SLIDE:
O	GET /API/RESOURCES — FETCHES COLLECTION.
O	POST /API/RESOURCES — CREATES A NEW RESOURCE.
•	UML: (ATTACH A DIAGRAM) 


5.	USER INTERFACE (UI) 
A.	5.1 WIREFRAMES / MOCKUPS
6.	DATA REQUIREMENTS

7.	TRACEABILITY MATRIX 

ID	REQUIREMENT	LINE OF CODE
US-01	The system will authenticate users via username and password.	152
US-02	Allow users to store workout information	256
US-03	Allow users to search their workout history	46
US-04	Allow users to add new workout types.	45

8.	AI USAGE & DISCLOSURE (MANDATORY)
•	MODEL(S) USED: [E.G., CLAUDE 3.5, GPT-4O]
•	PROMPTS USED DURING CODING: 



