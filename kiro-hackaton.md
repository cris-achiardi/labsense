# LabSense - Code with Kiro Hackathon Submission

## General Info

### Project Name
**LabSense** - Intelligent Lab Result Prioritization System

### Elevator Pitch
Intelligent lab result analysis for Chilean healthcare - automatically flags critical patients, turning hours of manual review into minutes of focused care.

## Project Details

### Project Story

#### Inspiration
At Chile's public primary care centers, routine blood tests expire after 12 months—even when initial results already show high glucose, cholesterol, triglycerides, liver enzymes or other health markers. Patients can wait an entire year for a retest, during which untreated risk factors may progress to diabetes, heart disease, kidney failure or stroke. Meanwhile, care teams spend hours each day manually reviewing thousands of lab reports—a job an AI could finish in minutes. This needless cycle delays treatment, worsens outcomes, increases public healthcare spending (funds that could go toward direct patient care, facility upgrades or preventive programs) and keeps clinicians tied up in administrative work instead of caring for people.

#### What it does

LabSense is a comprehensive web application designed specifically for Chilean public primary care centers that revolutionizes how healthcare workers handle laboratory results. Here's what the system accomplishes:

**🔍 Intelligent PDF Processing**
- Automatically extracts patient information and lab results from Spanish-language PDF reports
- Recognizes Chilean-specific formats including RUT identification, Spanish medical terminology, and local lab structures
- Parses complex multi-page reports while avoiding data duplication
- Handles various sample types (SUERO, SANGRE TOTAL, ORINA) and different laboratory formats

**⚡ Automated Health Marker Analysis**
- Identifies critical health markers including glucose, cholesterol, triglycerides, liver enzymes, HbA1c, TSH, and more
- Uses reference ranges provided directly in the PDF documents (no external database needed)
- Detects abnormal values using Chilean medical standards and laboratory-specific normal ranges
- Recognizes abnormal indicators like `[ * ]` markers that Chilean labs use to flag concerning values

**🚨 Smart Priority Scoring**
- Calculates priority scores based on severity and number of abnormal values
- Assigns severity levels: normal, mild, moderate, severe
- Applies special weighting for critical markers like diabetes indicators
- Flags patients requiring immediate medical attention (like our test case: 73-year-old with glucose 269 mg/dL and severe hypothyroidism)

**📊 Healthcare Worker Dashboard**
- Displays prioritized patient lists sorted by urgency (HIGH/MEDIUM/LOW priority)
- Shows patient identification (name, RUT), abnormal markers, and priority levels in Spanish
- Provides search and filtering capabilities by patient name, RUT, date ranges, and specific health markers
- Enables quick status updates when patients are contacted or processed

**📈 Historical Tracking & Trends**
- Maintains complete patient lab history for trend analysis
- Tracks changes in health markers over time with visual indicators (improving, worsening, stable)
- Helps healthcare workers make informed decisions based on patient progression
- Supports long-term patient care management

**🔐 Healthcare-Grade Security**
- Implements Google OAuth authentication with role-based access control
- Provides comprehensive audit trails tracking who accessed what patient data and when
- Includes automatic session timeouts and secure logout for shared devices
- Maintains data retention policies compliant with healthcare regulations

**✅ Intelligent Validation System**
- Uses automated confidence scoring to validate parsing accuracy
- Auto-approves high-confidence extractions (85%+) to reduce manual work
- Flags medium-confidence cases (70-84%) for optional spot-checks
- Requires manual review for low-confidence extractions (<70%)
- Always validates critical values (glucose >250, HbA1c >10) regardless of confidence
- Provides side-by-side PDF comparison interface for manual review cases

**🌐 Spanish Language Native Support**
- Built from the ground up for Spanish-speaking healthcare workers
- Recognizes Chilean medical terminology and date formats
- Handles Spanish health marker names (glucosa, colesterol, triglicéridos, etc.)
- Provides user interface entirely in Spanish with appropriate medical terminology

**📱 Modern Web Architecture**
- Built with Next.js for fast, responsive performance
- Uses Supabase for secure, scalable database and file storage
- Implements Row Level Security for patient data protection
- Designed for easy deployment and maintenance

**Real-World Impact Example:**
In our analysis of a real Chilean lab report, LabSense successfully identified a 73-year-old female patient with:
- Severe diabetes (glucose 269 mg/dL, normal: 74-106)
- Poor long-term glucose control (HbA1c 11.8%, normal: 4-6)
- Severe hypothyroidism (TSH 11.040, normal: 0.55-4.78)

The system correctly flagged this as HIGH priority, enabling immediate medical intervention that could prevent diabetic complications, cardiovascular disease, and thyroid-related health issues. This demonstrates how LabSense transforms administrative burden into life-saving healthcare efficiency.

**System Benefits:**
- **For Healthcare Workers**: Reduces manual review time from hours to minutes, focuses attention on patients who need immediate care
- **For Patients**: Faster identification of health issues, reduced wait times for follow-up care, prevention of disease progression
- **For Healthcare System**: More efficient resource allocation, reduced administrative costs, improved patient outcomes, better compliance with care standards

**Future AI Enhancement Roadmap:**
- **Machine Learning PDF Parsing**: Train models to handle diverse lab formats and improve extraction accuracy
- **Natural Language Processing**: Advanced Spanish medical text understanding for terminology variations
- **Predictive Analytics**: ML models to predict patient risk trajectories based on lab trends and historical data
- **Adaptive Learning**: System learns from healthcare worker corrections to continuously improve accuracy
- **Computer Vision**: Direct image analysis of lab reports for better data extraction
- **Clinical Decision Support**: AI-powered recommendations for follow-up care based on patient patterns

LabSense doesn't just digitize lab results—it intelligently prioritizes human health, ensuring that no critical value goes unnoticed and no patient waits unnecessarily for life-changing medical care. The current rule-based intelligent system provides immediate value while establishing the foundation for advanced AI capabilities as the platform scales.

#### How we built it

[To be completed]

#### Challenges we ran into

[To be completed]

#### Accomplishments that we're proud of

[To be completed]

#### What we learned

[To be completed]