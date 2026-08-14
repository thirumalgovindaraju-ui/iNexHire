// src/data/jobTemplates.data.ts
// India-specific job role templates seeded into JobTemplate. Kept separate from
// seed.ts because of sheer size — 22 templates, each with a full JD and 8 questions.

export interface JobTemplateSeed {
  title: string;
  sector: 'IT_SERVICES' | 'BPO' | 'BANKING' | 'MANUFACTURING' | 'HEALTHCARE';
  level: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'MANAGER';
  skills: string[];
  jobDescription: string;
  sampleQuestions: string[];
  salaryMinLakhs: number;
  salaryMaxLakhs: number;
}

export const JOB_TEMPLATES: JobTemplateSeed[] = [
  // ─── IT Services ────────────────────────────────────────────────────────────
  {
    title: 'Java Developer',
    sector: 'IT_SERVICES',
    level: 'JUNIOR',
    skills: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Git', 'Data Structures'],
    jobDescription: `We are hiring a Junior Java Developer to join our engineering team in Bengaluru, working on backend services for enterprise clients.

## Responsibilities
- Build and maintain REST APIs using Java and Spring Boot
- Write clean, testable code and participate in code reviews
- Work with senior engineers to debug and fix production issues
- Contribute to database design and SQL query optimization

## Requirements
- 0-2 years of experience with Java and object-oriented programming
- Familiarity with Spring Boot and REST API design
- Basic SQL and relational database knowledge
- Understanding of data structures and algorithms
- Comfortable working with Git in a team environment

## Nice to Have
- Exposure to microservices architecture
- Familiarity with unit testing frameworks (JUnit/Mockito)
- Internship or academic project experience with Java`,
    sampleQuestions: [
      'Walk us through a Java project you built during your degree or internship — what was your role?',
      "What's the difference between an ArrayList and a LinkedList? When would you choose one over the other?",
      "Explain how Spring Boot's dependency injection works, in your own words.",
      "You're given a slow SQL query joining three tables — how would you start diagnosing it?",
      'Describe a time you had to debug a tricky NullPointerException. What was your process?',
      'How would you design a simple REST API for a to-do list application?',
      "What's the difference between == and .equals() in Java?",
      "If a senior engineer asked you to write unit tests for a class you didn't write, how would you approach it?",
    ],
    salaryMinLakhs: 4,
    salaryMaxLakhs: 7,
  },
  {
    title: 'Java Developer',
    sector: 'IT_SERVICES',
    level: 'SENIOR',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'AWS', 'System Design', 'SQL', 'CI/CD'],
    jobDescription: `We are hiring a Senior Java Developer in Hyderabad to lead backend architecture for a large enterprise client's microservices migration.

## Responsibilities
- Design and build scalable microservices using Java and Spring Boot
- Lead technical decisions on service boundaries, messaging, and data consistency
- Mentor junior and mid-level developers on the team
- Own production reliability for services you build — on-call rotation included

## Requirements
- 6+ years of Java backend development experience
- Strong experience with microservices architecture and distributed systems
- Hands-on experience with Kafka or similar messaging systems
- Experience deploying and operating services on AWS
- Comfortable driving system design discussions with architects and clients

## Nice to Have
- Experience with a monolith-to-microservices migration
- Client-facing experience in a services/consulting environment
- Exposure to observability tooling (Datadog, Grafana, ELK)`,
    sampleQuestions: [
      "Walk me through a microservices architecture you've designed or significantly contributed to.",
      'How do you handle distributed transactions across microservices without two-phase commit?',
      'Describe a production incident you led the resolution for. What was the root cause and fix?',
      'How would you design a rate limiter for a high-traffic API gateway?',
      "What's your approach to mentoring junior developers on your team?",
      "Explain how you'd migrate a monolith to microservices without downtime.",
      'How do you decide between synchronous REST calls and async messaging (Kafka/RabbitMQ) between services?',
      'Tell me about a time you pushed back on a technical decision made by a client or architect. How did you handle it?',
    ],
    salaryMinLakhs: 18,
    salaryMaxLakhs: 28,
  },
  {
    title: 'React Developer',
    sector: 'IT_SERVICES',
    level: 'MID',
    skills: ['React', 'TypeScript', 'Redux/Zustand', 'REST APIs', 'Jest', 'CSS/Tailwind'],
    jobDescription: `We are hiring a React Developer in Chennai to build customer-facing web applications for a US-based client.

## Responsibilities
- Build responsive, accessible UI features using React and TypeScript
- Collaborate closely with designers and backend engineers on a distributed team
- Write unit and integration tests for the components you build
- Participate in sprint planning and code reviews

## Requirements
- 3-5 years of experience building production React applications
- Strong TypeScript skills and comfort with modern state management (Redux, Zustand, or Context)
- Experience integrating with REST APIs
- Familiarity with testing tools like Jest and React Testing Library

## Nice to Have
- Experience working with US/EU clients across time zones
- Exposure to Next.js or server-side rendering
- Basic understanding of web accessibility (a11y) standards`,
    sampleQuestions: [
      "Tell me about the most complex React application you've built — what made it complex?",
      'How do you decide between local component state, Context, and a state management library like Redux?',
      'Describe a performance issue you diagnosed and fixed in a React app.',
      'How would you structure a large React + TypeScript codebase for a team of 6 engineers?',
      "Walk me through how you'd test a component that makes an API call and shows a loading state.",
      "What's your approach to handling stale closures with useEffect and useCallback?",
      "Describe a time you disagreed with a designer's spec. How did you resolve it?",
      'How do you approach making a web application accessible (a11y)?',
    ],
    salaryMinLakhs: 8,
    salaryMaxLakhs: 14,
  },
  {
    title: 'Python ML Engineer',
    sector: 'IT_SERVICES',
    level: 'SENIOR',
    skills: ['Python', 'TensorFlow/PyTorch', 'MLOps', 'SQL', 'AWS/GCP', 'Data Pipelines', 'Statistics'],
    jobDescription: `We are hiring a Senior Python ML Engineer in Bengaluru to build and productionize machine learning pipelines for a fintech/analytics client.

## Responsibilities
- Design, train, and deploy ML models for production use cases
- Build and maintain data pipelines feeding model training and inference
- Set up monitoring for model drift and performance degradation
- Collaborate with data scientists to move models from notebook to production

## Requirements
- 5+ years of experience in Python and applied machine learning
- Hands-on experience with TensorFlow or PyTorch
- Experience with MLOps tooling (MLflow, Airflow, SageMaker, or similar)
- Strong SQL and data pipeline experience
- Solid grounding in statistics and experiment design

## Nice to Have
- Experience in fintech, credit risk, or fraud detection domains
- Experience presenting model results to non-technical stakeholders
- Cloud ML platform experience (AWS SageMaker, GCP Vertex AI)`,
    sampleQuestions: [
      'Walk me through an ML model you took from prototype to production. What broke along the way?',
      'How do you detect and handle data drift in a deployed model?',
      'Describe your approach to feature engineering for a tabular dataset with many missing values.',
      "How would you explain a complex model's predictions to a non-technical stakeholder?",
      "What's your experience with MLOps tooling (MLflow, Airflow, SageMaker, etc.)?",
      'Tell me about a time a model performed well in testing but poorly in production. What happened?',
      'How do you approach A/B testing a new model version against the current production model?',
      "Describe a disagreement you've had with a data scientist or product manager about model design. How was it resolved?",
    ],
    salaryMinLakhs: 20,
    salaryMaxLakhs: 32,
  },
  {
    title: 'DevOps Engineer',
    sector: 'IT_SERVICES',
    level: 'MID',
    skills: ['AWS/Azure', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux', 'Monitoring'],
    jobDescription: `We are hiring a DevOps Engineer in Hyderabad to manage cloud infrastructure across multiple client projects.

## Responsibilities
- Build and maintain CI/CD pipelines for containerized applications
- Manage Kubernetes clusters and infrastructure-as-code across environments
- Set up monitoring, logging, and alerting for production systems
- Respond to incidents and lead root-cause analysis for outages

## Requirements
- 3-6 years of experience in DevOps/SRE roles
- Hands-on experience with Kubernetes, Docker, and Terraform
- Experience with at least one major cloud provider (AWS or Azure)
- Strong Linux fundamentals and scripting ability

## Nice to Have
- Experience managing infrastructure for multiple concurrent client projects
- Exposure to cost optimization on cloud spend
- Security/compliance experience (SOC2, ISO 27001)`,
    sampleQuestions: [
      "Walk me through how you'd set up a CI/CD pipeline for a containerized microservice from scratch.",
      'Describe an incident where a deployment caused an outage. How did you detect and resolve it?',
      'How do you approach managing infrastructure as code across dev, staging, and production environments?',
      "What's your strategy for Kubernetes resource limits and autoscaling on a cost-conscious project?",
      'How would you set up centralized logging and alerting for a system with 15 microservices?',
      'Tell me about a security vulnerability you found in your infrastructure. What did you do?',
      'How do you handle secrets management in a CI/CD pipeline?',
      'Describe a time you had to convince a development team to adopt a new DevOps practice.',
    ],
    salaryMinLakhs: 10,
    salaryMaxLakhs: 18,
  },
  {
    title: 'QA Automation Engineer',
    sector: 'IT_SERVICES',
    level: 'MID',
    skills: ['Selenium/Playwright', 'Java/Python', 'API Testing', 'CI/CD', 'Test Strategy', 'SQL'],
    jobDescription: `We are hiring a QA Automation Engineer in Chennai to own test automation for a banking client's web platform.

## Responsibilities
- Design and build automation frameworks for web and API testing
- Integrate automated tests into CI/CD pipelines for fast feedback
- Identify, debug, and report defects with clear reproduction steps
- Balance automated coverage with manual/exploratory testing where needed

## Requirements
- 3-5 years of experience in QA automation
- Hands-on experience with Selenium or Playwright
- Proficiency in Java or Python for writing test scripts
- Experience testing REST APIs and working with SQL for test data validation

## Nice to Have
- Experience testing in a regulated (banking/finance) environment
- Performance/load testing experience (JMeter, k6)
- Experience mentoring manual testers into automation`,
    sampleQuestions: [
      "Walk me through how you'd design an automation framework for a new web application from scratch.",
      'How do you decide what to automate versus test manually?',
      'Describe a flaky test you debugged. What was causing the flakiness and how did you fix it?',
      'How would you test a REST API for both functional correctness and performance?',
      'Tell me about a critical bug you found right before a release. What did you do?',
      'How do you integrate automated tests into a CI/CD pipeline to give fast feedback?',
      'Describe your approach to test data management for automated tests.',
      'How do you communicate testing risk to a project manager who wants to ship faster?',
    ],
    salaryMinLakhs: 7,
    salaryMaxLakhs: 12,
  },
  {
    title: 'Business Analyst',
    sector: 'IT_SERVICES',
    level: 'MID',
    skills: ['Requirements Gathering', 'SQL', 'Stakeholder Management', 'Agile/Scrum', 'Documentation', 'Excel/PowerBI'],
    jobDescription: `We are hiring a Business Analyst in Bengaluru to bridge business stakeholders and engineering teams for an enterprise client engagement.

## Responsibilities
- Gather and document requirements from client stakeholders
- Translate business needs into clear user stories for engineering teams
- Facilitate communication between client, product, and engineering
- Use data to help prioritize the product backlog

## Requirements
- 3-6 years of experience as a business analyst on software projects
- Strong stakeholder management and communication skills
- Working knowledge of SQL for data validation
- Experience working within Agile/Scrum delivery teams

## Nice to Have
- Experience with BI tools (Power BI, Tableau)
- Domain experience in BFSI, retail, or healthcare
- Certification in Business Analysis (CBAP) or Agile (CSPO)`,
    sampleQuestions: [
      "Walk me through how you'd gather requirements for a new feature from a client with vague expectations.",
      'Describe a time requirements changed midway through a sprint. How did you handle it?',
      'How do you write a user story so that both business and engineering understand it the same way?',
      'Tell me about a conflict between what the client wanted and what was technically feasible. How did you resolve it?',
      'How would you use data to prioritize a backlog with 30 competing feature requests?',
      'Describe a project where you had to manage multiple stakeholders with different priorities.',
      'How do you validate that a delivered feature actually meets the original business requirement?',
      'Tell me about a time you had to say no to a stakeholder. How did you frame it?',
    ],
    salaryMinLakhs: 8,
    salaryMaxLakhs: 14,
  },
  {
    title: 'Project Manager',
    sector: 'IT_SERVICES',
    level: 'SENIOR',
    skills: ['Agile/Scrum', 'Risk Management', 'Client Management', 'Budgeting', 'JIRA', 'Team Leadership'],
    jobDescription: `We are hiring a Senior Project Manager in Hyderabad to manage delivery across multiple parallel client engagements.

## Responsibilities
- Own end-to-end delivery for one or more client engagements
- Manage scope, budget, timeline, and risk across projects
- Lead distributed teams (onsite + offshore) and manage client relationships
- Report project health and escalate risks to leadership proactively

## Requirements
- 8+ years of project management experience in IT services/consulting
- Strong experience with Agile/Scrum delivery methodology
- Track record of managing fixed-scope, fixed-price client contracts
- Excellent client-facing communication skills

## Nice to Have
- PMP or Certified Scrum Master (CSM) certification
- Experience managing teams of 15+ across multiple time zones
- Experience turning around an at-risk project`,
    sampleQuestions: [
      'Walk me through a project that was at risk of missing its deadline. What did you do?',
      'How do you manage scope creep from a client without damaging the relationship?',
      'Describe how you handle a team member who is consistently underperforming.',
      'Tell me about a time you had to deliver bad news to a client. How did you approach it?',
      'How do you balance being agile with fixed-scope, fixed-price client contracts?',
      'Describe your approach to estimating a project with significant technical unknowns.',
      'How do you keep a distributed team (onsite + offshore) aligned and motivated?',
      'Tell me about the most difficult stakeholder you\'ve managed and how you built trust with them.',
    ],
    salaryMinLakhs: 16,
    salaryMaxLakhs: 26,
  },
  {
    title: 'Solution Architect',
    sector: 'IT_SERVICES',
    level: 'LEAD',
    skills: ['System Design', 'Cloud Architecture', 'Microservices', 'Security', 'Stakeholder Management', 'Cost Optimization'],
    jobDescription: `We are hiring a Solution Architect in Bengaluru to design enterprise architecture for large digital transformation programs.

## Responsibilities
- Design end-to-end system architecture for large, multi-team programs
- Advise on cloud architecture, security, and cost optimization decisions
- Balance architectural quality against delivery timelines and client budgets
- Present and defend architecture decisions to client executives

## Requirements
- 10+ years of experience in software engineering, including architecture roles
- Deep experience with cloud architecture (AWS/Azure/GCP) and microservices
- Strong understanding of application and infrastructure security
- Excellent communication skills for both technical and executive audiences

## Nice to Have
- Experience with large-scale digital transformation programs
- Cloud architecture certifications (AWS/Azure Solutions Architect)
- Experience managing multi-vendor technical ecosystems`,
    sampleQuestions: [
      'Walk me through the most complex system architecture you\'ve designed end-to-end.',
      'How do you balance architectural purity against delivery timelines and client budget constraints?',
      'Describe a time you had to choose between build vs. buy for a critical component.',
      'How would you architect a system that must support both real-time and batch processing at scale?',
      'Tell me about a time your architecture recommendation was rejected by leadership. What did you do?',
      'How do you approach securing a system that integrates with several third-party APIs?',
      'Describe how you evaluate and mitigate technical debt in a large, multi-year program.',
      'How do you communicate a complex architecture decision to non-technical executives?',
    ],
    salaryMinLakhs: 28,
    salaryMaxLakhs: 45,
  },

  // ─── BPO ─────────────────────────────────────────────────────────────────────
  {
    title: 'Customer Service Representative',
    sector: 'BPO',
    level: 'JUNIOR',
    skills: ['Communication', 'Customer Handling', 'CRM Tools', 'English/Hindi Proficiency', 'Typing Speed'],
    jobDescription: `We are hiring Customer Service Representatives in Bengaluru/Gurugram for a voice process supporting international and domestic customers.

## Responsibilities
- Handle inbound customer calls/chats professionally and efficiently
- Resolve customer queries using CRM tools and internal knowledge base
- Escalate complex issues to the appropriate team while keeping the customer informed
- Meet quality, productivity, and adherence targets

## Requirements
- Excellent verbal communication in English (Hindi proficiency a plus)
- Comfortable working in rotational shifts, including night shifts for international clients
- Basic computer literacy and typing speed of 25+ WPM
- Patience and composure when handling difficult customers

## Nice to Have
- Prior experience in a voice-based BPO or call center role
- Experience with CRM tools like Salesforce or Zendesk`,
    sampleQuestions: [
      'Tell me about a time you dealt with an angry customer. What did you say to calm them down?',
      'How would you handle a customer asking for a refund outside company policy?',
      "Describe a time you didn't know the answer to a customer's question. What did you do?",
      'How do you stay patient during a long shift handling repetitive queries?',
      'Walk me through how you would explain a technical issue to a non-technical customer.',
      'Tell me about a time you had to say no to a customer request. How did you phrase it?',
      'How would you handle multiple customers waiting in queue during a system outage?',
      'Describe your typical process for closing a customer call/chat.',
    ],
    salaryMinLakhs: 3,
    salaryMaxLakhs: 4,
  },
  {
    title: 'Team Leader',
    sector: 'BPO',
    level: 'MID',
    skills: ['Team Management', 'Performance Coaching', 'SLA Management', 'Reporting', 'Conflict Resolution'],
    jobDescription: `We are hiring a Team Leader in Chennai/Bengaluru to manage a 15-20 agent team on a voice/chat process.

## Responsibilities
- Manage day-to-day performance of a team of 15-20 customer service agents
- Coach agents on quality, productivity, and adherence to targets
- Track and report on SLA performance to operations management
- Handle escalations and resolve conflicts within the team

## Requirements
- 3-5 years of BPO experience, including 1+ years in a team lead/supervisory role
- Strong coaching and performance management skills
- Experience managing SLAs and productivity metrics
- Comfortable working in a high-volume, target-driven environment

## Nice to Have
- Experience managing teams during peak/surge periods (festive season, sales events)
- Experience with workforce management tools`,
    sampleQuestions: [
      "Walk me through how you'd coach an agent whose call quality scores have been slipping.",
      'Describe a time your team missed an SLA. What did you do?',
      'How do you motivate a team during a high-volume, high-stress period (e.g. festive season surge)?',
      'Tell me about a conflict between two team members. How did you resolve it?',
      'How do you balance meeting productivity metrics with maintaining quality of service?',
      "Describe how you'd onboard and ramp up 5 new hires in two weeks.",
      'Tell me about a time you disagreed with a decision from your operations manager.',
      'How do you identify and retain your top performers?',
    ],
    salaryMinLakhs: 5,
    salaryMaxLakhs: 8,
  },
  {
    title: 'Quality Analyst',
    sector: 'BPO',
    level: 'MID',
    skills: ['Call Auditing', 'Quality Frameworks', 'Feedback Delivery', 'Reporting', 'Compliance'],
    jobDescription: `We are hiring a Quality Analyst in Hyderabad to audit calls and chats for quality and compliance across a BPO process.

## Responsibilities
- Audit customer interactions (calls/chats) against defined quality scorecards
- Deliver constructive feedback to agents and team leaders
- Identify systemic quality issues and recommend process improvements
- Ensure compliance with internal and client-mandated quality standards

## Requirements
- 3-5 years of BPO experience, including 1+ years in a quality analyst role
- Strong attention to detail and objectivity when auditing
- Comfortable delivering difficult feedback professionally
- Experience with quality reporting and scorecard design

## Nice to Have
- Six Sigma or quality management certification
- Experience auditing for a regulated process (banking, healthcare)`,
    sampleQuestions: [
      'Walk me through how you evaluate a customer call against a quality scorecard.',
      'Describe a time you gave difficult feedback to an agent. How did you deliver it?',
      'How do you stay objective when auditing a friend or well-liked colleague?',
      'Tell me about a compliance violation you caught. What did you do next?',
      'How would you identify a systemic issue affecting quality scores across a whole team?',
      "Describe how you'd design a quality scorecard for a new process.",
      "How do you handle disagreement from an agent who thinks your audit was unfair?",
      'Tell me about a time your quality feedback led to a measurable improvement.',
    ],
    salaryMinLakhs: 4,
    salaryMaxLakhs: 7,
  },
  {
    title: 'Process Trainer',
    sector: 'BPO',
    level: 'MID',
    skills: ['Training Delivery', 'Curriculum Design', 'Presentation Skills', 'Assessment Design', 'Process Knowledge'],
    jobDescription: `We are hiring a Process Trainer in Bengaluru to design and deliver training for new hires and ongoing process updates.

## Responsibilities
- Design and deliver induction training for new hire batches
- Update training materials to reflect process changes
- Assess trainee readiness through certification tests and mock calls
- Partner with operations and quality teams to close skill gaps

## Requirements
- 3-5 years of BPO experience, including 1+ years in a training role
- Strong presentation and facilitation skills for groups of 20+
- Experience designing assessments and certification criteria
- Deep process knowledge of the relevant BPO domain

## Nice to Have
- Train-the-trainer certification
- Experience training on multiple processes/LOBs simultaneously`,
    sampleQuestions: [
      "Walk me through how you'd design a training program for a brand-new process with no existing materials.",
      'Describe a time a batch of trainees was struggling. What did you change?',
      'How do you assess whether training actually transferred to on-the-job performance?',
      'Tell me about a time you had to train on a process you personally disagreed with.',
      'How do you keep a training session engaging for a group of 20+ trainees?',
      "Describe how you'd update training materials after a major process change.",
      'How do you handle a trainee who is clearly not going to pass certification?',
      'Tell me about feedback you received on your training style and how you acted on it.',
    ],
    salaryMinLakhs: 5,
    salaryMaxLakhs: 8,
  },

  // ─── Banking ─────────────────────────────────────────────────────────────────
  {
    title: 'Relationship Manager',
    sector: 'BANKING',
    level: 'MID',
    skills: ['Sales', 'Client Relationship Management', 'Cross-selling', 'Banking Products', 'Communication'],
    jobDescription: `We are hiring a Relationship Manager for a branch in Mumbai/Chennai to manage a portfolio of retail and HNI clients.

## Responsibilities
- Manage and grow a portfolio of retail/HNI banking clients
- Cross-sell banking products (loans, insurance, investments) appropriately
- Build long-term client relationships and handle escalations
- Meet sales targets while maintaining regulatory compliance

## Requirements
- 3-6 years of experience in retail/relationship banking or financial sales
- Strong communication and relationship-building skills
- Working knowledge of banking products and cross-selling techniques
- Comfortable working towards sales targets in a compliant manner

## Nice to Have
- AMFI/IRDA certification for mutual funds/insurance sales
- Experience managing HNI or NRI client portfolios`,
    sampleQuestions: [
      'Walk me through how you\'d grow a portfolio of 100 dormant client accounts.',
      'Describe a time a client was upset about a fee or charge. How did you handle it?',
      "How do you balance meeting sales targets with acting in the client's best interest?",
      "Tell me about the most complex financial product you've sold. How did you explain it to a client?",
      'How would you identify cross-selling opportunities without seeming pushy?',
      'Describe a time you lost a client to a competitor bank. What did you learn?',
      'How do you stay compliant while under pressure to hit a sales quota?',
      'Tell me about a client relationship you built from scratch that became highly profitable.',
    ],
    salaryMinLakhs: 6,
    salaryMaxLakhs: 11,
  },
  {
    title: 'Credit Analyst',
    sector: 'BANKING',
    level: 'MID',
    skills: ['Financial Analysis', 'Credit Risk', 'Excel', 'Regulatory Knowledge (RBI norms)', 'Report Writing'],
    jobDescription: `We are hiring a Credit Analyst in Mumbai/Bengaluru to assess creditworthiness for retail and SME loan applications.

## Responsibilities
- Analyze financial statements and creditworthiness of loan applicants
- Prepare credit memos with clear risk assessment and recommendations
- Ensure compliance with RBI lending norms and internal credit policy
- Collaborate with relationship managers on deal structuring

## Requirements
- 3-6 years of experience in credit analysis or underwriting
- Strong financial statement analysis and Excel modeling skills
- Working knowledge of RBI regulatory norms for lending
- Ability to write clear, well-supported credit memos

## Nice to Have
- CA/CFA/MBA (Finance) qualification
- Experience underwriting SME or working capital facilities`,
    sampleQuestions: [
      "Walk me through how you'd assess the creditworthiness of an SME with inconsistent financial statements.",
      'Describe a loan application you recommended rejecting despite pressure to approve it.',
      'How do you factor qualitative risk (e.g. management quality, industry outlook) into a credit decision?',
      'Tell me about a time your credit assessment turned out to be wrong. What did you learn?',
      'How do you stay current with RBI regulatory changes affecting lending norms?',
      "Describe how you'd structure a credit memo for a complex working capital facility.",
      'How do you handle disagreement with a relationship manager who wants a deal approved quickly?',
      "Tell me about the most complex financial model you've built for a credit assessment.",
    ],
    salaryMinLakhs: 7,
    salaryMaxLakhs: 13,
  },
  {
    title: 'Branch Manager',
    sector: 'BANKING',
    level: 'SENIOR',
    skills: ['Branch Operations', 'Team Leadership', 'Sales Management', 'Compliance', 'P&L Management'],
    jobDescription: `We are hiring a Branch Manager to run day-to-day operations, sales, and compliance for a branch in a Tier-1/Tier-2 city.

## Responsibilities
- Own branch P&L, sales targets, and operational efficiency
- Lead and develop branch staff, balancing sales pressure with staff wellbeing
- Ensure full compliance with regulatory and audit requirements
- Build relationships with local businesses to grow the branch's book

## Requirements
- 8+ years of banking experience, including branch operations/management
- Strong track record of meeting sales and compliance targets simultaneously
- Experience managing and developing a mixed-performance team
- Comfortable handling regulatory audits and inspections

## Nice to Have
- Experience turning around an underperforming branch
- Local market/community relationships in the branch's catchment area`,
    sampleQuestions: [
      "Walk me through how you'd turn around an underperforming branch.",
      'Describe a compliance audit finding you had to address. What was your action plan?',
      'How do you balance sales pressure from regional leadership with staff wellbeing?',
      'Tell me about a fraud attempt or near-miss at your branch. How did you handle it?',
      'How do you manage a team with a mix of high performers and long-tenured underperformers?',
      'Describe how you\'d handle a major system outage affecting customer transactions.',
      "How do you build relationships with local businesses to grow the branch's book?",
      'Tell me about a difficult regulatory inspection and how you prepared your team for it.',
    ],
    salaryMinLakhs: 12,
    salaryMaxLakhs: 20,
  },
  {
    title: 'KYC Analyst',
    sector: 'BANKING',
    level: 'JUNIOR',
    skills: ['KYC/AML Norms', 'Document Verification', 'Attention to Detail', 'Regulatory Compliance', 'Data Entry Accuracy'],
    jobDescription: `We are hiring a KYC Analyst in Bengaluru/Pune to verify customer documentation and ensure AML compliance for new account openings.

## Responsibilities
- Verify customer identity documents against KYC/AML requirements
- Flag suspicious or inconsistent documentation for further review
- Maintain high accuracy while processing a high daily volume of applications
- Stay current with evolving RBI/regulatory KYC requirements

## Requirements
- 0-2 years of experience, ideally in banking/financial services operations
- Strong attention to detail and process discipline
- Basic understanding of KYC/AML norms (training provided)
- Comfortable working with data entry systems accurately and quickly

## Nice to Have
- Prior experience in a KYC, AML, or documentation verification role
- Certification in AML/KYC compliance`,
    sampleQuestions: [
      "Walk me through your process for verifying a new customer's identity documents.",
      'Describe a time you spotted a suspicious or potentially fraudulent document.',
      'How do you stay accurate and thorough when processing a high volume of KYC applications daily?',
      "Tell me about a case where a customer's documents didn't match — what did you do?",
      'How would you explain AML red flags to someone new to the KYC process?',
      'Describe a time you had to escalate a case despite pressure to process it quickly.',
      'How do you keep up to date with changing RBI/regulatory KYC requirements?',
      'Tell me about a mistake you made in document verification and how you corrected it.',
    ],
    salaryMinLakhs: 3.5,
    salaryMaxLakhs: 6,
  },

  // ─── Manufacturing ───────────────────────────────────────────────────────────
  {
    title: 'Production Supervisor',
    sector: 'MANUFACTURING',
    level: 'MID',
    skills: ['Production Planning', 'Lean Manufacturing', 'Team Supervision', 'Quality Standards', 'Safety Compliance'],
    jobDescription: `We are hiring a Production Supervisor for a manufacturing plant near Chennai/Pune to oversee a shop-floor production line.

## Responsibilities
- Supervise daily production line operations and staff
- Diagnose and resolve output, quality, and downtime issues
- Enforce safety standards and lead incident response when needed
- Drive continuous improvement (lean/kaizen) initiatives on the line

## Requirements
- 4-7 years of shop-floor manufacturing experience, including supervisory experience
- Working knowledge of lean manufacturing principles
- Strong people management skills for shift-based teams
- Familiarity with safety compliance standards

## Nice to Have
- Six Sigma Green Belt certification
- Experience with ERP-driven production planning`,
    sampleQuestions: [
      "Walk me through how you'd diagnose a sudden drop in line output.",
      'Describe a safety incident on your line. What did you do immediately, and afterward?',
      'How do you handle a worker who is consistently missing production targets?',
      'Tell me about a time you implemented a lean/kaizen improvement. What was the impact?',
      'How do you balance production targets against quality standards under deadline pressure?',
      "Describe how you'd manage a shift handover to avoid loss of information.",
      'How do you handle conflict between shift workers on your line?',
      'Tell me about a machine breakdown that disrupted production. How did you manage the response?',
    ],
    salaryMinLakhs: 6,
    salaryMaxLakhs: 10,
  },
  {
    title: 'Quality Control Engineer',
    sector: 'MANUFACTURING',
    level: 'MID',
    skills: ['Quality Standards (ISO)', 'Statistical Process Control', 'Root Cause Analysis', 'Inspection Tools', 'Documentation'],
    jobDescription: `We are hiring a Quality Control Engineer for a manufacturing plant in Pune/Chennai to ensure product quality compliance.

## Responsibilities
- Monitor product quality using statistical process control methods
- Investigate defects and lead root cause analysis (5 Whys, fishbone, etc.)
- Maintain ISO quality documentation and prepare for audits
- Train shop-floor staff on quality procedures

## Requirements
- 3-6 years of quality engineering experience in a manufacturing environment
- Working knowledge of ISO quality standards and SPC tools
- Strong root cause analysis and problem-solving skills
- Comfortable holding the line on quality standards under production pressure

## Nice to Have
- Six Sigma certification
- Experience with automotive (IATF 16949) or similar quality standards`,
    sampleQuestions: [
      "Walk me through how you'd investigate a spike in defect rate on the production line.",
      'Describe a time you rejected a batch despite pressure to ship on time.',
      'How do you use statistical process control to catch quality issues before they become defects?',
      'Tell me about a root cause analysis you led. What tools did you use (5 Whys, fishbone, etc.)?',
      'How do you handle disagreement with production staff who think your standards are too strict?',
      "Describe how you'd prepare a plant for an ISO quality audit.",
      'How do you balance customer quality complaints with internal production constraints?',
      'Tell me about a time you had to train shop-floor workers on a new quality procedure.',
    ],
    salaryMinLakhs: 6,
    salaryMaxLakhs: 11,
  },
  {
    title: 'Supply Chain Manager',
    sector: 'MANUFACTURING',
    level: 'SENIOR',
    skills: ['Supply Chain Planning', 'Vendor Management', 'Inventory Optimization', 'Logistics', 'ERP (SAP)'],
    jobDescription: `We are hiring a Supply Chain Manager in Pune/Bengaluru to manage end-to-end supply chain for a manufacturing business.

## Responsibilities
- Own procurement, inventory planning, and logistics for the business unit
- Manage vendor relationships and negotiate terms proactively
- Balance inventory holding costs against stockout risk
- Respond to supply disruptions (shortages, logistics delays) quickly

## Requirements
- 8+ years of supply chain/procurement experience in manufacturing
- Strong vendor negotiation and relationship management skills
- Hands-on experience with ERP systems (SAP or similar) for planning
- Track record of managing supply chain risk and disruptions

## Nice to Have
- Six Sigma or APICS/CPIM certification
- Experience managing multi-supplier, multi-site supply chains`,
    sampleQuestions: [
      'Walk me through how you\'d respond to a critical raw material shortage affecting production.',
      'Describe a time you renegotiated terms with a vendor who was underperforming.',
      'How do you balance inventory holding costs against stockout risk?',
      'Tell me about a supply chain disruption (e.g. logistics strike, port delay) you managed.',
      'How do you evaluate whether to single-source or multi-source a critical component?',
      'Describe how you use ERP data to forecast demand and plan procurement.',
      'How do you manage relationships with vendors who are also key suppliers to competitors?',
      'Tell me about a cost-saving initiative you led in the supply chain. What was the outcome?',
    ],
    salaryMinLakhs: 14,
    salaryMaxLakhs: 22,
  },

  // ─── Healthcare ──────────────────────────────────────────────────────────────
  {
    title: 'Hospital Administrator',
    sector: 'HEALTHCARE',
    level: 'SENIOR',
    skills: ['Hospital Operations', 'Regulatory Compliance (NABH)', 'Budget Management', 'Staff Management', 'Patient Experience'],
    jobDescription: `We are hiring a Hospital Administrator for a multi-specialty hospital in Chennai/Hyderabad to manage day-to-day operations.

## Responsibilities
- Oversee daily hospital operations across departments
- Manage budgets while ensuring quality patient care standards
- Ensure compliance with NABH accreditation requirements
- Handle patient grievances and mediate conflicts between staff and administration

## Requirements
- 8+ years of hospital administration or healthcare management experience
- Strong understanding of NABH accreditation and regulatory compliance
- Experience managing hospital budgets and cost efficiency
- Excellent conflict resolution and stakeholder management skills

## Nice to Have
- MHA (Master of Hospital Administration) or equivalent qualification
- Experience managing a multi-specialty or tertiary care hospital`,
    sampleQuestions: [
      'Walk me through how you\'d handle a patient complaint that escalated to a formal grievance.',
      "Describe how you've managed a budget shortfall without compromising patient care.",
      'How do you ensure compliance with NABH accreditation standards across departments?',
      'Tell me about a staffing crisis (e.g. nurse shortage) you had to resolve quickly.',
      'How do you balance cost efficiency with quality of patient care in your decisions?',
      'Describe a conflict between medical staff and administration. How did you mediate it?',
      'How do you handle a critical equipment failure during patient care hours?',
      'Tell me about an initiative you led to improve patient experience scores.',
    ],
    salaryMinLakhs: 12,
    salaryMaxLakhs: 20,
  },
  {
    title: 'Medical Coder',
    sector: 'HEALTHCARE',
    level: 'JUNIOR',
    skills: ['ICD-10/CPT Coding', 'Medical Terminology', 'HIPAA Compliance', 'Attention to Detail', 'EHR Systems'],
    jobDescription: `We are hiring a Medical Coder in Chennai/Hyderabad for a healthcare revenue cycle management (RCM) client serving US hospitals.

## Responsibilities
- Assign accurate ICD-10 and CPT codes to patient medical records
- Identify and resolve coding discrepancies before claim submission
- Maintain HIPAA compliance when handling patient health information
- Meet daily coding volume and accuracy targets

## Requirements
- Certification in medical coding (CPC or equivalent) or strong medical terminology background
- 0-2 years of experience in medical coding or a related healthcare role
- Strong attention to detail and ability to work with EHR systems
- Understanding of HIPAA compliance requirements

## Nice to Have
- Experience coding for US-based healthcare clients
- Specialty coding experience (e.g. cardiology, orthopedics)`,
    sampleQuestions: [
      'Walk me through how you\'d code a discharge summary for a patient with multiple diagnoses.',
      'Describe a time you found a coding discrepancy that could have led to a claim denial.',
      'How do you stay accurate and fast when coding a high volume of charts per day?',
      "Tell me about a time you weren't sure which code applied. What did you do?",
      'How do you keep up with annual ICD-10/CPT code updates?',
      "Describe how you'd handle a physician's documentation that's incomplete or ambiguous.",
      'How do you ensure HIPAA compliance while handling sensitive patient data?',
      'Tell me about feedback you received on a coding error and how you improved.',
    ],
    salaryMinLakhs: 3,
    salaryMaxLakhs: 6,
  },
];
