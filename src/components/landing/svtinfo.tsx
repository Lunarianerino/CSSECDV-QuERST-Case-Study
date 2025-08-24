const headingClassName = "text-2xl pt-5 pb-2 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent";

export function SvtInfo() {
    return (<div>
        <h1 className={headingClassName}>About QuERST /kwerst/</h1>
        <p><span className="font-extrabold"><span className="text-hero">Qu</span>ality <span className="text-hero">E</span>ducation in <span className="text-hero">R</span>esource-challenged <span className="text-hero">S</span>chools with the help of <span className="text-hero">T</span>echnology</span> is a multi-stakeholder, multi-component, multi-phase initiative that seeks to <mark>rapidly improve learning outcomes in economically disadvantaged schools</mark> through the effective use of information and communication technologies.</p>
        <h1 className={headingClassName}>SVT 2026</h1>
        <p>A flagship project of <span className="text-hero">QuERST</span>, the Summer Virtual Tutorial (SVT) serves two purposes: it allows us to test and refine our online tutoring protocols and support systems, and it directly helps learners who are struggling to keep up academically.</p>
        <p>SVT 2026 will run from <mark>May 4 to May 29, 2026</mark>. Each volunteer tutor will be paired with one tutee for <mark>hour-long daily online sessions (Monday–Friday) for four weeks</mark>.</p>
        <h1 className={headingClassName}>Coverage</h1>
        <p>This year’s SVT focuses on preparing incoming Grade 5 students for Quarter 1 (Q1) Mathematics and Science. However, the tutorials will not teach the Grade 5 Q1 competencies themselves. Instead, tutors will help learners <mark>acquire the prerequisite skills from Grades 2 to 4</mark>—particularly those in math, science, and English—that are necessary for success in Grade 5.</p>
    </div>);
}

export function TutorResponsibilities() {
    return (<div>
        <h1 className={headingClassName}>Tutor Responsibilities</h1>
        <ul className="list-inside list-disc">
            <li>Participate in email correspondence with the SVT Project Team (starting March 2026) and Messenger group during the tutorial weeks.</li>
            <li>Answer questionnaires for tutor-tutee matching in March 2026</li>
            <li>Review the <span className="text-hero">QuERST</span> SVT 2026 Competencies and Prerequisite Relationships document, which outlines vertical and horizontal dependencies among learning competencies and contains links to teacher-made slides and DepEd self-learning modules</li>
            <li>Conduct one-on-one (or in rare cases, one-on-two) online tutoring sessions following the <span className="text-hero">QuERST</span> SVT 2026 Tutoring Protocols</li>
            <li>Ensure access to a device and a stable internet connection</li>
            <li>Submit a case report via Google Form after each tutoring session</li>
            <li>Complete an end-of-program survey</li>
            <li>(If available) Attend the SVT 2026 Culminating Ceremony at the partner school near DLSU Laguna</li>
        </ul>
    </div>);
}