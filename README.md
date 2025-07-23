# QuizMaster Pro - AI-Powered Quiz Platform (Frontend)


## Table of Contents

- [Project Overview](#project-overview)
- [Live Demo](#live-demo)
- [Core Features](#core-features)
  - [User Features](#user-features)
  - [Teacher Features](#teacher-features)
  - [Admin Features](#admin-features)
- [Tech Stack](#tech-stack)


## Project Overview

QuizMaster Pro is a modern, full-stack quiz application built with Next.js and a Python backend. It's designed as a comprehensive platform for educational institutions and individuals, offering role-based access control for Admins, Teachers, and regular Users.

The platform's standout feature is its AI-powered quiz generation, which can instantly create assessments from uploaded documents (.pdf, .txt, .docx, .pptx). It also provides detailed performance analytics, user management, and a hierarchical content structure (Subjects -> Chapters -> Quizzes).

This repository contains the complete frontend code for the QuizMaster Pro application.

## Live Demo

[**Click here for the live demo.**](https://quizmaster-frontend-v2.vercel.app/)

## Core Features

The application is designed with a robust role-based access system. Here's a breakdown of features available to each role:

### User Features

* **Secure Authentication**: Users can register and log in to a secure account.
* **Personalized Dashboard**: A central hub where users can see their assigned subjects and start quizzes.
* **Interactive Quiz Taking**: A clean and intuitive interface for attempting Multiple Choice (MCQ) and Multiple Select (MSQ) questions.
* **Attempt Limits & Re-requests**: Users have a limited number of attempts per quiz and can request a re-attempt once the limit is reached.
* **Instant Scoring & Feedback**: See the score and correct answers immediately after submitting a quiz.
* **Detailed Performance Analytics**: A dedicated page to visualize performance, including average scores, best/worst subjects, and recent trends using interactive charts.
* **Attempt History**: A comprehensive log of all past quiz attempts, grouped by quiz, showing scores and timestamps.

### Teacher Features

* **Teacher Dashboard**: A specialized dashboard to view assigned subjects and the students enrolled in them.
* **Student Performance Monitoring**: Teachers can view detailed performance analytics for each of their students.
* **Content Management**: Teachers can create, edit, and delete the subjects, chapters, and quizzes they are assigned to, ensuring they only manage their own content.
* **AI & Manual Quiz Creation**: Full access to the powerful quiz creation tools for their subjects.

### Admin Features

* **Comprehensive Admin Dashboard**: A high-level overview of the entire platform, with key stats on users, content, and recent activity.
* **Full User Management**: Admins can add, view, filter, and delete any user on the platform.
* **Role Management**: Assign roles (User, Teacher, Admin) to users.
* **Subject Assignment**: Admins can assign specific subjects to Teachers and Users, controlling their access to content.
* **Full Content Control**: Unrestricted access to create, edit, and delete all subjects, chapters, and quizzes across the platform.

## Tech Stack

This project is built with a modern, robust, and scalable technology stack:

| Category      | Technology                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| **Framework** | [**Next.js 15**](https://nextjs.org/)                                                           |
| **Language** | [**TypeScript**](https://www.typescriptlang.org/)                                               |
| **Styling** | [**Tailwind CSS 4**](https://tailwindcss.com/)                                                  |
| **UI/UX** | [**React 19**](https://react.dev/)                                                                  |
| **Charting** | [**Recharts**](https://recharts.org/) for data visualization                                    |
| **Icons** | [**Lucide React**](https://lucide.dev/) for a clean and consistent icon set                           |
| **Linting** | [**ESLint**](https://eslint.org/) with Next.js configurations                                      |
| **Backend** | [**FastAPI**](https://fastapi.tiangolo.com/) A Python-based API Framework serving the data.                       |
