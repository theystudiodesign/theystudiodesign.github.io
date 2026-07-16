# -*- coding: utf-8 -*-
# THE'Y — القاموس العربي (فصحى مهنية، RTL)
# Clés = chaînes EXACTES des pages EN. Les flèches → sont inversées globalement par build.py.

META = {
    '': ("THE’Y ستوديو ديزاين — علامات يستحيل تجاهلها",
         "‏THE’Y ستوديو تصميم مستقل يبتكر هويات العلامات والتجارب الرقمية للشركات الطموحة. الدار البيضاء ← العالم."),
    'work/': ("الأعمال — THE’Y ستوديو ديزاين",
              "أعمال مختارة، 2023 → اليوم. هويات علامات وتجارب رقمية وإدارة فنية — كل مشروع قصة بنهاية مالية."),
    'services/': ("الخدمات — THE’Y ستوديو ديزاين",
                  "نتقن ثلاثة أشياء إتقانًا تامًا: هوية العلامة، التصميم الرقمي والويب، الإدارة الفنية والمحتوى. Sprint أو Signature أو Partner — عروض أسعار ثابتة ونصيحة صادقة."),
    'studio/': ("الستوديو — THE’Y ستوديو ديزاين",
                "‏THE’Y ستوديو تصميم رفيع الخبرة في الدار البيضاء يعمل مع العالم. معظم التصميم زخرفة. تصميمنا قرار."),
    'contact/': ("تواصل معنا — THE’Y ستوديو ديزاين",
                 "ابدأ مشروعًا مع THE’Y. طلب في 60 ثانية، ردّ خلال 24 ساعة، وعرض ثابت خلال 3 أيام من مكالمة التعارف."),
    'privacy/': ("الخصوصية — THE’Y ستوديو ديزاين", "سياسة الخصوصية لدى THE’Y ستوديو ديزاين."),
    'terms/': ("الشروط — THE’Y ستوديو ديزاين", "شروط استخدام theystudiodesign.com."),
}
OG = {
    '': "THE’Y ستوديو ديزاين",
    'work/': "الأعمال — THE’Y ستوديو ديزاين",
    'services/': "الخدمات — THE’Y ستوديو ديزاين",
    'studio/': "الستوديو — THE’Y ستوديو ديزاين",
    'contact/': "تواصل معنا — THE’Y ستوديو ديزاين",
    'privacy/': "الخصوصية — THE’Y ستوديو ديزاين",
    'terms/': "الشروط — THE’Y ستوديو ديزاين",
}

STRINGS = {
    # ===== المشترك =====
    "Skip to content": "تجاوز إلى المحتوى",
    ">Work</a>": ">الأعمال</a>",
    ">Services</a>": ">الخدمات</a>",
    ">Studio</a>": ">الستوديو</a>",
    ">Contact</a>": ">تواصل</a>",
    ">Start a project</a>": ">ابدأ مشروعًا</a>",
    "Start a project <span": "ابدأ مشروعًا <span",
    "THE’Y Studio Design — home": "THE’Y ستوديو ديزاين — الرئيسية",

    # footer
    "Have a project in mind?": "هل لديك مشروع في بالك؟",
    ">Book a call</a>": ">احجز مكالمة</a>",
    '<p class="label">Sitemap</p>': '<p class="label">خريطة الموقع</p>',
    '<p class="label">Socials</p>': '<p class="label">التواصل الاجتماعي</p>',
    '<p class="label">Contact</p>': '<p class="label">التواصل</p>',
    "<p>Casablanca, Morocco</p>": "<p>الدار البيضاء، المغرب</p>",
    "<p>Local time: <span data-local-time>": "<p>التوقيت المحلي: <span data-local-time>",
    'title="Click to copy"': 'title="انقر للنسخ"',
    ">Privacy</a>": ">الخصوصية</a>",
    ">Terms</a>": ">الشروط</a>",

    # ===== الرئيسية =====
    "Brands that refuse<br>to be ignored.": "علامات يستحيل<br>تجاهلها.",
    '<span class="label">Brand &amp; digital design studio</span>': '<span class="label">ستوديو تصميم علامات وتجارب رقمية</span>',
    "</span>Available for new projects": "</span>متاحون لمشاريع جديدة",
    'THE’Y is an independent design studio crafting brand identities and digital experiences for ambitious companies. Casablanca&nbsp;→&nbsp;<span class="serif-accent">worldwide</span>.':
        '‏THE’Y ستوديو تصميم مستقل يبتكر هويات العلامات والتجارب الرقمية للشركات الطموحة. الدار البيضاء&nbsp;→&nbsp;<span class="serif-accent">العالم</span>.',
    '"hero-cta-note label">Replies within 24 hours<': '"hero-cta-note label">نرد خلال 24 ساعة<',
    "</span> brands launched</span>": "</span> علامة أُطلقت</span>",
    "</span> industries</span>": "</span> قطاعات</span>",
    "</span> repeat &amp; referral</span>": "</span> ولاء وترشيح</span>",
    '<span class="hero-clock label">Casablanca · ': '<span class="hero-clock label">الدار البيضاء · ',
    "See the work <span": "شاهد الأعمال <span",
    '>Scroll</span>': '>مرّر</span>',
    "Selected work (01–04)": "أعمال مختارة (01–04)",
    "All work <span": "كل الأعمال <span",
    'data-cursor-chip="View case study →"': 'data-cursor-chip="اعرض دراسة الحالة →"',
    'data-cursor-chip="All work →"': 'data-cursor-chip="كل الأعمال →"',
    "Repositioned for enterprise → 3× average deal size": "إعادة تموضع نحو الشركات الكبرى → متوسط الصفقة ×3",
    "Rebrand + e-commerce → +140% qualified traffic": "هوية جديدة + متجر إلكتروني → +140% زيارات مؤهلة",
    "A visual voice that filled the season in 6 weeks": "صوت بصري ملأ الموسم في 6 أسابيع",
    ">Brand Identity</span>": ">هوية العلامة</span>",
    ">Digital &amp; Web</span>": ">رقمي وويب</span>",
    ">Art Direction</span>": ">إدارة فنية</span>",
    ">Finance</span>": ">مالية</span>",
    ">Beauty</span>": ">تجميل</span>",
    ">Hospitality</span>": ">ضيافة</span>",
    "The next case study": "دراسة الحالة القادمة",
    "We publish only work we’d sign twice.": "لا ننشر إلا عملًا نوقّع عليه مرتين.",
    "↗ Your project": "↗ مشروعك",
    ">What we do</h2>": ">ما الذي نفعله</h2>",
    "Strategy, systems and guidelines for companies that outgrew their image.": "استراتيجية وأنظمة وأدلة للشركات التي كبرت على صورتها.",
    ">Digital &amp; Web Design</span>": ">التصميم الرقمي والويب</span>",
    "Websites that feel like the brand, never like a template.": "مواقع تُحسّ بروح العلامة، لا بقالب جاهز.",
    ">Art Direction &amp; Content</span>": ">الإدارة الفنية والمحتوى</span>",
    "One consistent visual voice, everywhere your brand appears.": "صوت بصري واحد متّسق أينما ظهرت علامتك.",
    ">Explore →</span>": ">استكشف →</span>",
    ">The studio</h2>": ">الستوديو</h2>",
    "We believe design is a business decision disguised as an aesthetic one.": "نؤمن أن التصميم قرار تجاري متنكّر في هيئة قرار جمالي.",
    "A senior studio, not a big one. We take on few projects, think before we draw, and stay until the work performs — from Casablanca, for clients anywhere.":
        "ستوديو رفيع الخبرة، لا ستوديو ضخم. نقبل مشاريع قليلة، نفكر قبل أن نرسم، ونبقى حتى يؤدي العمل — من الدار البيضاء، لعملاء في كل مكان.",
    "About the studio <span": "عن الستوديو <span",
    ">How it works</h2>": ">كيف نعمل</h2>",
    "<span class=\"n\">01</span> Discover</h3>": "<span class=\"n\">01</span> نستكشف</h3>",
    "We interrogate the business, the audience and the ambition before anything visual.": "نسائل العمل والجمهور والطموح قبل أي شيء بصري.",
    "<span class=\"n\">02</span> Define</h3>": "<span class=\"n\">02</span> نحدّد</h3>",
    "Positioning, strategy and a sharp brief — agreed in writing before design starts.": "تموضع واستراتيجية وموجز دقيق — يُعتمد كتابةً قبل بدء التصميم.",
    "<span class=\"n\">03</span> Design</h3>": "<span class=\"n\">03</span> نصمّم</h3>",
    "Concepts, iterations and honest feedback loops. You see real work every week.": "مفاهيم وتكرارات وحلقات ملاحظات صادقة. ترى عملًا حقيقيًا كل أسبوع.",
    "<span class=\"n\">04</span> Deliver</h3>": "<span class=\"n\">04</span> نسلّم</h3>",
    "A complete system, launch assets and guidelines — shipped on the date we set.": "نظام كامل وأصول إطلاق ودليل علامة — يُسلَّم في الموعد المحدد.",
    ">Why clients stay</h2>": ">لماذا يبقى العملاء</h2>",
    ">Brands launched</span>": ">علامة أُطلقت</span>",
    ">Industries served</span>": ">قطاعات نخدمها</span>",
    ">Referral &amp; repeat rate</span>": ">نسبة التوصية والعودة</span>",
    "They didn’t give us a logo. They gave us a point of view — and the numbers followed.": "لم يمنحونا شعارًا، بل وجهة نظر — وتبعتها الأرقام.",
    "Founder &amp; CEO — Atlas Capital": "المؤسس والرئيس التنفيذي — أطلس كابيتال",
    "The first agency that asked about our margins before our moodboards.": "أول وكالة سألت عن هوامش أرباحنا قبل لوحات الإلهام.",
    "Managing Director — Noor Skincare": "المديرة العامة — نور للعناية بالبشرة",
    "Every deadline met, every detail considered. It felt like an in-house team with better taste.": "كل موعد التُزم به، وكل تفصيل دُرس. كأنهم فريق داخلي بذوق أرفع.",
    "Marketing Lead — Dar Mimosa": "مسؤولة التسويق — دار ميموزا",
    'aria-label="Previous testimonial"': 'aria-label="الشهادة السابقة"',
    'aria-label="Next testimonial"': 'aria-label="الشهادة التالية"',

    # ===== الأعمال =====
    ">Work</span>": ">الأعمال</span>",
    "Selected work, 2023 → today.": "أعمال مختارة، 2023 → اليوم.",
    "We publish only work we’d sign twice. Every project below is a story with a financial ending — a challenge, a strategy, and what happened next.":
        "لا ننشر إلا عملًا نوقّع عليه مرتين. كل مشروع أدناه قصة بنهاية مالية — تحدٍّ، واستراتيجية، وما حدث بعد ذلك.",
    'aria-label="Filter projects"': 'aria-label="تصفية المشاريع"',
    '>All</button>': '>الكل</button>',
    '>Brand Identity</button>': '>هوية العلامة</button>',
    '>Digital</button>': '>رقمي</button>',
    '>Art Direction</button>': '>إدارة فنية</button>',
    "Your project could be the next entry on this page.": "مشروعك قد يكون الإضافة القادمة إلى هذه الصفحة.",
    'aria-label="Case studies"': 'aria-label="دراسات الحالة"',

    # ===== الخدمات =====
    ">Services</span>": ">الخدمات</span>",
    "We do three things. We do them extremely well.": "نتقن ثلاثة أشياء. ونتقنها إتقانًا تامًا.",
    "Focus is a feature. By refusing to be a full-service everything-agency, we stay senior on every project, honest about what we’re not, and accountable for what we are: brand, web, and the visual voice that carries both.":
        "التركيز ميزة. برفضنا أن نكون وكالة لكل شيء، نبقى رفيعي الخبرة في كل مشروع، صادقين بشأن ما لسنا عليه، ومسؤولين عمّا نحن عليه: العلامة، والويب، والصوت البصري الذي يحملهما معًا.",
    'aria-label="Service pillars"': 'aria-label="أركان الخدمات"',
    '<h2 class="pillar-title">Brand Identity</h2>': '<h2 class="pillar-title">هوية العلامة</h2>',
    "For companies that have outgrown their image.": "للشركات التي كبرت على صورتها.",
    "<li>Strategy &amp; positioning</li>": "<li>الاستراتيجية والتموضع</li>",
    "<li>Naming support</li>": "<li>المواكبة في التسمية</li>",
    "<li>Logo &amp; visual system</li>": "<li>الشعار والنظام البصري</li>",
    "<li>Typography &amp; color</li>": "<li>الخطوط والألوان</li>",
    "<li>Brand guidelines</li>": "<li>دليل العلامة</li>",
    "<li>Launch assets</li>": "<li>أصول الإطلاق</li>",
    "<strong>Ideal for:</strong> funded startups entering serious rooms, established companies whose work outgrew their look, founders preparing a launch that has one shot at a first impression.":
        "<strong>مثالي لـ:</strong> الشركات الناشئة الممولة الداخلة إلى قاعات جادة، والشركات الراسخة التي تجاوز عملُها مظهرَها، والمؤسسين الذين يحضّرون إطلاقًا لا يملك سوى فرصة واحدة للانطباع الأول.",
    "You leave with a system, not a logo file.": "تخرج بنظام متكامل، لا بملف شعار.",
    "Discuss this <span": "ناقش هذا <span",
    '<h2 class="pillar-title">Digital &amp; Web Design</h2>': '<h2 class="pillar-title">التصميم الرقمي والويب</h2>',
    "Websites that feel like the brand, not a template.": "مواقع تُحسّ بروح العلامة، لا بقالب.",
    "<li>UX architecture</li>": "<li>هندسة تجربة المستخدم</li>",
    "<li>Art direction for web</li>": "<li>الإدارة الفنية للويب</li>",
    "<li>Design systems</li>": "<li>أنظمة التصميم</li>",
    "<li>High-craft marketing sites</li>": "<li>مواقع تسويقية عالية الحرفية</li>",
    "<li>Interaction &amp; motion design</li>": "<li>تصميم التفاعل والحركة</li>",
    "<li>Launch &amp; performance QA</li>": "<li>فحص الإطلاق والأداء</li>",
    "<strong>Ideal for:</strong> brands whose website is losing the argument their product wins, teams replacing a template with a point of view, launches where the site is the product’s first proof.":
        "<strong>مثالي لـ:</strong> العلامات التي يخسر موقعُها النقاشَ الذي يكسبه منتجُها، والفرق التي تستبدل بالقالب وجهةَ نظر، والإطلاقات التي يكون فيها الموقع أول برهان على المنتج.",
    "Designed to be felt in the first five seconds.": "مصمَّم ليُحَسّ في الثواني الخمس الأولى.",
    '<h2 class="pillar-title">Art Direction &amp; Content</h2>': '<h2 class="pillar-title">الإدارة الفنية والمحتوى</h2>',
    "A consistent visual voice, everywhere.": "صوت بصري متّسق، في كل مكان.",
    "<li>Campaign direction</li>": "<li>إدارة الحملات</li>",
    "<li>Social &amp; content systems</li>": "<li>أنظمة السوشيال والمحتوى</li>",
    "<li>Packaging &amp; print</li>": "<li>التغليف والمطبوعات</li>",
    "<li>Pitch decks &amp; brand collateral</li>": "<li>عروض تقديمية ومواد العلامة</li>",
    "<li>Photography direction</li>": "<li>إدارة التصوير</li>",
    "<li>Ongoing creative partnership</li>": "<li>شراكة إبداعية مستمرة</li>",
    "<strong>Ideal for:</strong> brands that look right once and wrong everywhere else, small teams who need a system they can run themselves, companies whose feed undoes their identity.":
        "<strong>مثالي لـ:</strong> العلامات الصحيحة في مكان والخاطئة في كل مكان آخر، والفرق الصغيرة التي تحتاج نظامًا تديره بنفسها، والشركات التي يهدم حسابُها هويتها.",
    "One voice, every channel.": "صوت واحد، في كل قناة.",
    ">How to work with THE’Y</h2>": ">كيف تعمل مع THE’Y</h2>",
    "Sprint <span class=\"dur\">2–4 weeks</span>": "Sprint <span class=\"dur\">2–4 أسابيع</span>",
    "One focused problem, fixed scope. A naming sprint, a landing page, a pitch deck that has to land.":
        "مشكلة واحدة محددة ونطاق ثابت. سباق تسمية، أو صفحة هبوط، أو عرض تقديمي يجب أن يصيب.",
    "Signature <span class=\"dur\">6–10 weeks</span>": "Signature <span class=\"dur\">6–10 أسابيع</span>",
    "The full brand or website engagement — strategy through launch. Most of our work, most of our case studies.":
        "المشروع الكامل للعلامة أو الموقع — من الاستراتيجية إلى الإطلاق. معظم عملنا، ومعظم دراسات حالتنا.",
    "Partner <span class=\"dur\">Ongoing</span>": "Partner <span class=\"dur\">مستمر</span>",
    "A retainer: THE’Y as your external design department. Priority access, compounding context.":
        "عقد شهري: THE’Y قسمَ التصميم الخارجي لديك. أولوية في الوصول، وسياق يتراكم.",
    ">On pricing</h2>": ">عن الأسعار</h2>",
    "Every engagement is scoped to the problem, not the hour. Signature brand engagements typically start around 5,000 DH; we’ll give you a precise, fixed quote after one call — and we’ll tell you honestly if we’re not the right fit, or if a smaller sprint would serve you better.":
        "كل مشروع يُقاس على حجم المشكلة لا على الساعة. مشاريع Signature تبدأ عادة من حوالي 5,000 درهم؛ نمنحك عرضًا ثابتًا ودقيقًا بعد مكالمة واحدة — ونخبرك بصدق إن لم نكن الخيار المناسب، أو إن كان سباق أصغر يخدمك أفضل.",
    ">The process, one level deeper</h2>": ">العملية، بمستوى أعمق</h2>",
    "<strong>What happens:</strong> stakeholder interviews, market and audience review, audit of everything you have.<br><br><strong>You get:</strong> a findings memo. <strong>We need:</strong> honesty and access.":
        "<strong>ما يحدث:</strong> مقابلات مع المعنيين، ومراجعة السوق والجمهور، وتدقيق كل ما لديك.<br><br><strong>تحصل على:</strong> مذكرة نتائج. <strong>نحتاج إلى:</strong> الصدق وإمكانية الوصول.",
    "<strong>What happens:</strong> positioning, strategy, and the brief distilled to one page you sign off.<br><br><strong>You get:</strong> the strategy document. <strong>We need:</strong> one decision-maker.":
        "<strong>ما يحدث:</strong> التموضع والاستراتيجية، والموجز مقطَّرًا في صفحة واحدة توقّع عليها.<br><br><strong>تحصل على:</strong> وثيقة الاستراتيجية. <strong>نحتاج إلى:</strong> صاحب قرار واحد.",
    "<strong>What happens:</strong> concepts, weekly working sessions, structured feedback rounds.<br><br><strong>You get:</strong> real work every week. <strong>We need:</strong> feedback within 48h.":
        "<strong>ما يحدث:</strong> مفاهيم، وجلسات عمل أسبوعية، وجولات ملاحظات منظمة.<br><br><strong>تحصل على:</strong> عمل حقيقي كل أسبوع. <strong>نحتاج إلى:</strong> ملاحظات خلال 48 ساعة.",
    "<strong>What happens:</strong> production, guidelines, handover, launch support.<br><br><strong>You get:</strong> the complete system plus a working session with your team. <strong>We need:</strong> nothing — this part is on us.":
        "<strong>ما يحدث:</strong> الإنتاج، والدليل، والتسليم، ومواكبة الإطلاق.<br><br><strong>تحصل على:</strong> النظام الكامل مع جلسة عمل لفريقك. <strong>نحتاج إلى:</strong> لا شيء — هذا الجزء علينا.",
    ">Questions we actually get</h2>": ">أسئلة تُطرح علينا فعلًا</h2>",
    "How long does a typical engagement take? <span": "كم يستغرق المشروع عادة؟ <span",
    "<p>Sprints run 2–4 weeks; Signature engagements 6–10 weeks depending on scope. We set the calendar in the proposal and we hold it — deadlines are design.</p>":
        "<p>تستغرق مشاريع Sprint من 2 إلى 4 أسابيع؛ ومشاريع Signature من 6 إلى 10 أسابيع حسب النطاق. نحدد الجدول في العرض ونلتزم به — فالمواعيد جزء من التصميم.</p>",
    "How many revisions are included? <span": "كم عدد التعديلات المشمولة؟ <span",
    "<p>Structured rounds, not unlimited laps: typically two per phase, plus a final polish pass. In practice, the weekly working sessions catch direction issues before they become “revisions.”</p>":
        "<p>جولات منظمة لا لفّات بلا نهاية: عادة جولتان في كل مرحلة، مع جولة صقل أخيرة. عمليًا، تلتقط جلسات العمل الأسبوعية قضايا الاتجاه قبل أن تصير «تعديلات».</p>",
    "Who do you work with? <span": "مع من تعملون؟ <span",
    "<p>Ambitious companies of any size that take design seriously as a business tool — from funded startups to established firms repositioning. Geography doesn’t matter; we work remotely with clients worldwide from Casablanca.</p>":
        "<p>شركات طموحة من كل الأحجام تأخذ التصميم بجدية كأداة عمل — من الناشئة الممولة إلى الراسخة التي تعيد تموضعها. الجغرافيا لا تهم؛ نعمل عن بُعد مع عملاء حول العالم من الدار البيضاء.</p>",
    "We’re pre-launch and don’t have everything figured out. Too early? <span": "لم نُطلق بعد ولم تتضح كل الأمور. هل الوقت مبكر؟ <span",
    "<p>Not necessarily — strategy is the first half of every engagement, and the Discover/Define phases exist precisely to sharpen what’s fuzzy. If it truly is too early, we’ll tell you on the first call and suggest what to do first.</p>":
        "<p>ليس بالضرورة — فالاستراتيجية نصف كل مشروع، ومرحلتا الاستكشاف والتحديد وُجدتا تحديدًا لشحذ ما هو ضبابي. وإن كان الوقت مبكرًا حقًا، نخبرك في المكالمة الأولى ونقترح ما ينبغي فعله أولًا.</p>",
    "Who owns the work? <span": "لمن تعود ملكية العمل؟ <span",
    "<p>You do. Full IP transfer of the final system on final payment, with source files and guidelines. We retain only the right to publish the case study — which we’ll clear with you first.</p>":
        "<p>لك أنت. نقل كامل للملكية الفكرية للنظام النهائي عند الدفعة الأخيرة، مع ملفات المصدر والدليل. نحتفظ فقط بحق نشر دراسة الحالة — بعد موافقتك أولًا.</p>",
    "How does remote collaboration work? <span": "كيف يسير العمل عن بُعد؟ <span",
    "<p>A shared workspace, one weekly working session on video, and asynchronous reviews in between. You always see work-in-progress, never a big reveal at the end. Time zones have never been the problem; silence has — so we don’t go silent.</p>":
        "<p>مساحة عمل مشتركة، وجلسة فيديو أسبوعية، ومراجعات غير متزامنة بينهما. ترى العمل الجاري دائمًا، ولا مفاجآت كبرى في النهاية. لم تكن فروق التوقيت يومًا هي المشكلة؛ الصمت هو المشكلة — لذلك لا نصمت.</p>",
    "What don’t you do? <span": "ما الذي لا تفعلونه؟ <span",
    "<p>Performance marketing, SEO retainers, video production at scale, and anything we can’t make excellent. When a project needs those, we bring in specialists we trust or point you to them directly.</p>":
        "<p>التسويق بالأداء، وعقود SEO الشهرية، وإنتاج الفيديو على نطاق واسع، وكل ما لا نستطيع جعله ممتازًا. حين يحتاج المشروع إليها، نستدعي مختصين نثق بهم أو نرشدك إليهم مباشرة.</p>",
    "Not sure which you need? That’s what the first call is for.": "لست متأكدًا مما تحتاجه؟ لهذا وُجدت المكالمة الأولى.",
    "Book a call <span": "احجز مكالمة <span",

    # ===== الستوديو =====
    ">The studio</span>": ">الستوديو</span>",
    "Most design is decoration. Ours is a decision.": "معظم التصميم زخرفة. تصميمنا قرار.",
    ">Why THE’Y exists</h2>": ">لماذا وُجد THE’Y</h2>",
    "<p>THE’Y started with an irritation: watching good companies lose arguments they should win, because their image spoke more quietly than their work. Somewhere between the big agencies that bill for meetings and the marketplaces that sell logos by the pound, there was a missing kind of studio — small enough to care about every pixel, senior enough to argue about the business behind it.</p>":
        "<p>بدأ THE’Y من ضيق: رؤية شركات جيدة تخسر نقاشات كان يجب أن تكسبها، لأن صورتها تتكلم بصوت أخفت من عملها. في مكان ما بين الوكالات الكبرى التي تفوتر الاجتماعات والأسواق التي تبيع الشعارات بالوزن، كان هناك نوع مفقود من الستوديوهات — صغير بما يكفي ليهتم بكل بكسل، ورفيع الخبرة بما يكفي ليناقش العمل الذي وراءه.</p>",
    "<p>So we built it. In Casablanca, on purpose: close to a market full of ambitious companies underserved by world-class design, and connected to clients everywhere who care about the work, not the postcode.</p>":
        "<p>فبنيناه. في الدار البيضاء، عن قصد: قريبًا من سوق مليء بشركات طموحة لا يصلها تصميم من الطراز العالمي، ومتصلًا بعملاء في كل مكان يهمهم العمل لا الرمز البريدي.</p>",
    "<p>We take on few projects at a time. We think before we draw. And we stay until the work performs — because a beautiful thing that doesn’t work is just an expensive apology.</p>":
        "<p>نقبل مشاريع قليلة في الوقت نفسه. نفكر قبل أن نرسم. ونبقى حتى يؤدي العمل — لأن الشيء الجميل الذي لا يعمل ليس سوى اعتذار باهظ.</p>",
    ">Studio — Casablanca</span>": ">الستوديو — الدار البيضاء</span>",
    ">What we refuse to negotiate</h2>": ">ما نرفض التفاوض عليه</h2>",
    ">Taste is non-negotiable</h3>": ">الذوق غير قابل للتفاوض</h3>",
    "We decline projects we can’t make excellent. Saying no is how the yes keeps its value.":
        "نعتذر عن المشاريع التي لا نستطيع جعلها ممتازة. قولُ «لا» هو ما يحفظ لكلمة «نعم» قيمتها.",
    ">Strategy before pixels</h3>": ">الاستراتيجية قبل البكسلات</h3>",
    "No design starts before the brief is sharp. If we can’t state your positioning in one sentence, we’re not ready to open the design tools.":
        "لا يبدأ أي تصميم قبل أن يصير الموجز حادًا. إن لم نستطع صياغة تموضعك في جملة واحدة، فلسنا مستعدين لفتح أدوات التصميم.",
    ">Small on purpose</h3>": ">صغير عن قصد</h3>",
    "You work with the people who do the work. No account layer, no handoffs to juniors you never met.":
        "تعمل مع من ينجزون العمل فعلًا. لا طبقة حسابات، ولا تمرير إلى مبتدئين لم تقابلهم قط.",
    ">Deadlines are design</h3>": ">المواعيد جزء من التصميم</h3>",
    "Craft that ships late isn’t craft. The calendar is agreed in the proposal and treated like part of the brief.":
        "الحِرفة التي تتأخر ليست حِرفة. يُعتمد الجدول في العرض ويُعامل كجزء من الموجز.",
    ">What it feels like to hire us</h2>": ">كيف يبدو التعاقد معنا</h2>",
    "<span class=\"n\">Wk 1–2</span> Discover</h3>": "<span class=\"n\">أسبوع 1–2</span> نستكشف</h3>",
    "Mostly conversations. We ask uncomfortable questions about money, customers and competitors. You’ll wonder when the design starts. That’s normal.":
        "محادثات في الغالب. نطرح أسئلة غير مريحة عن المال والعملاء والمنافسين. ستتساءل متى يبدأ التصميم. هذا طبيعي.",
    "<span class=\"n\">Wk 2–3</span> Define</h3>": "<span class=\"n\">أسبوع 2–3</span> نحدّد</h3>",
    "You receive a one-page brief that sounds more like you than you expected. You sign it. Everything after is measured against it.":
        "تتسلّم موجزًا من صفحة واحدة يشبهك أكثر مما توقعت. توقّع عليه. وكل ما يأتي بعده يُقاس عليه.",
    "<span class=\"n\">Wk 3–8</span> Design</h3>": "<span class=\"n\">أسبوع 3–8</span> نصمّم</h3>",
    "A working session every week — real work on the table, never a mystery reveal. Feedback goes in one document, decisions get made, momentum stays visible.":
        "جلسة عمل كل أسبوع — عمل حقيقي على الطاولة، لا كشف غامض في النهاية. الملاحظات في وثيقة واحدة، والقرارات تُتخذ، والزخم يبقى مرئيًا.",
    "<span class=\"n\">Final wk</span> Deliver</h3>": "<span class=\"n\">الأسبوع الأخير</span> نسلّم</h3>",
    "The full system arrives with guidelines your team can actually use, plus a handover session. Then we check in after launch — because results are the point.":
        "يصل النظام الكامل مع دليل يستطيع فريقك استخدامه فعلًا، مع جلسة تسليم. ثم نعود بعد الإطلاق — لأن النتائج هي الغاية.",
    ">The honest comparison</h2>": ">المقارنة الصادقة</h2>",
    ">A big agency</h3>": ">وكالة كبيرة</h3>",
    "<li>Impressive room, then juniors</li>": "<li>قاعة مبهرة، ثم مبتدئون</li>",
    "<li>Process designed for billing</li>": "<li>عملية مصممة للفوترة</li>",
    "<li>Six weeks to the first sketch</li>": "<li>ستة أسابيع حتى أول رسم</li>",
    "<li>Your project: one of forty</li>": "<li>مشروعك: واحد من أربعين</li>",
    ">A freelancer</h3>": ">مستقل</h3>",
    "<li>Execution without strategy</li>": "<li>تنفيذ بلا استراتيجية</li>",
    "<li>One pair of hands, one ceiling</li>": "<li>يدان اثنتان، وسقف واحد</li>",
    "<li>Disappears at the worst moment</li>": "<li>يختفي في أسوأ لحظة</li>",
    "<li>A logo, not a system</li>": "<li>شعار، لا نظام</li>",
    "<li>Senior hands on every deliverable</li>": "<li>أيادٍ خبيرة في كل مُخرَج</li>",
    "<li>Strategy first, in writing</li>": "<li>الاستراتيجية أولًا، كتابةً</li>",
    "<li>Real work on the table weekly</li>": "<li>عمل حقيقي على الطاولة أسبوعيًا</li>",
    "<li>A system your team can run</li>": "<li>نظام يستطيع فريقك إدارته</li>",
    ">The people</h2>": ">الأشخاص</h2>",
    ">Founder — portrait</span>": ">المؤسس — صورة</span>",
    "A senior studio, not a big one.": "ستوديو رفيع الخبرة، لا ستوديو ضخم.",
    "THE’Y is led by its founder — the person you meet on the first call is the person who designs your brand. Around the core, a trusted network of specialists joins per project: type designers, photographers, developers, strategists. You get a team assembled for your problem, not a bench we need to keep busy.":
        "يقود THE’Y مؤسسُه — الشخص الذي تقابله في المكالمة الأولى هو من يصمم علامتك. وحول النواة، تنضم إلى كل مشروع شبكة موثوقة من المختصين: مصممو خطوط، ومصورون، ومطورون، واستراتيجيون. تحصل على فريق جُمع لمشكلتك، لا مقاعد علينا إشغالها.",
    "One human detail: the studio runs on mint tea and the firm belief that the best design reviews happen before noon.":
        "تفصيل إنساني واحد: يعمل الستوديو على الشاي بالنعناع وعلى قناعة راسخة بأن أفضل مراجعات التصميم تحدث قبل الظهر.",
    ">Selected clients</h2>": ">عملاء مختارون</h2>",
    "<span>&amp; yours →</span>": "<span>وعلامتك →</span>",
    "Now you know how we think. Show us your problem.": "الآن عرفت كيف نفكر. أرِنا مشكلتك.",

    # ===== التواصل =====
    ">Contact</span>": ">تواصل</span>",
    "Let’s make something they can’t ignore.": "لنصنع شيئًا يستحيل تجاهله.",
    "Casablanca · GMT+1 · Local time: <span data-local-time>": "الدار البيضاء · GMT+1 · التوقيت المحلي: <span data-local-time>",
    "<span>Replies within 24 hours</span>": "<span>ردّ خلال 24 ساعة</span>",
    "What do you need?": "ما الذي تحتاجه؟",
    '>Not sure yet</button>': '>لست متأكدًا بعد</button>',
    '>Digital &amp; Web</button>': '>رقمي وويب</button>',
    "Describe it in a sentence": "صِفه في جملة واحدة",
    'placeholder="e.g. We’ve outgrown our brand and it shows."': 'placeholder="مثال: كبرنا على علامتنا، وهذا واضح."',
    "Continue <span": "متابعة <span",
    "Budget &amp; timing — roughly.": "الميزانية والتوقيت — تقريبًا.",
    ">Budget range (DH)</p>": ">نطاق الميزانية (بالدرهم)</p>",
    '>&lt; 2&nbsp;500&nbsp;DH</button>': '>أقل من 2&nbsp;500 درهم</button>',
    '>2&nbsp;500 – 5&nbsp;000&nbsp;DH</button>': '>2&nbsp;500 – 5&nbsp;000 درهم</button>',
    '>5&nbsp;000 – 10&nbsp;000&nbsp;DH</button>': '>5&nbsp;000 – 10&nbsp;000 درهم</button>',
    '>10&nbsp;000&nbsp;DH +</button>': '>أكثر من 10&nbsp;000 درهم</button>',
    '>Advise me</button>': '>انصحوني</button>',
    ">Timeline</p>": ">الإطار الزمني</p>",
    '>ASAP</button>': '>في أقرب وقت</button>',
    '>1–3 months</button>': '>1–3 أشهر</button>',
    '>Flexible</button>': '>مرن</button>',
    "← Back</button>": "← رجوع</button>",
    "And you are?": "ومن أنت؟",
    '<label for="f-name">Name</label>': '<label for="f-name">الاسم</label>',
    "We need a name to reply to.": "نحتاج اسمًا لنردّ عليه.",
    '<label for="f-email">Email</label>': '<label for="f-email">البريد الإلكتروني</label>',
    "A valid email — it’s how we reply within 24h.": "بريد إلكتروني صالح — به نردّ خلال 24 ساعة.",
    'Company <span style="text-transform:none;letter-spacing:0">(optional)</span>': 'الشركة <span style="text-transform:none;letter-spacing:0">(اختياري)</span>',
    'Current site or brand <span style="text-transform:none;letter-spacing:0">(optional)</span>': 'الموقع أو العلامة الحالية <span style="text-transform:none;letter-spacing:0">(اختياري)</span>',
    "Send inquiry <span": "أرسل الطلب <span",
    ">Received</span>": ">تم الاستلام</span>",
    "A human replies within 24 hours.": "إنسانٌ يردّ عليك خلال 24 ساعة.",
    "Your inquiry is in. If your mail client opened, hit send — that’s the original on its way to us.":
        "طلبك وصل. إن فُتح برنامج البريد لديك فاضغط إرسال — تلك هي النسخة الأصلية في طريقها إلينا.",
    ">Book the call now</a>": ">احجز المكالمة الآن</a>",
    ">Prefer to talk?</span>": ">تفضّل الحديث مباشرة؟</span>",
    "Discovery call — 30 min": "مكالمة تعارف — 30 دقيقة",
    "A focused half hour on your problem, not a sales pitch. Video by default, no obligation, honest advice even if we’re not the right fit.":
        "نصف ساعة مركزة على مشكلتك، لا عرض مبيعات. بالفيديو افتراضيًا، دون التزام، وبنصيحة صادقة حتى إن لم نكن الخيار المناسب.",
    'aria-label="What happens next"': 'aria-label="ما الذي يحدث بعد ذلك"',
    "We reply within 24 hours.": "نردّ خلال 24 ساعة.",
    "A 30-minute discovery call.": "مكالمة تعارف مدتها 30 دقيقة.",
    "A fixed proposal within 3 days of the call.": "عرض ثابت خلال 3 أيام من المكالمة.",
    "Leave this field empty": "اترك هذا الحقل فارغًا",

    # ===== الخصوصية =====
    ">Legal</span>": ">قانوني</span>",
    "Privacy policy": "سياسة الخصوصية",
    "Last updated: 14 July 2026": "آخر تحديث: 14 يوليو 2026",
    "<h2>The short version</h2>": "<h2>الخلاصة</h2>",
    "<p>We collect only what you send us, we use it only to reply to you and run our engagements, and we never sell it. No advertising trackers run on this site.</p>":
        "<p>لا نجمع إلا ما ترسله إلينا، ولا نستخدمه إلا للرد عليك وإدارة مشاريعنا، ولا نبيعه أبدًا. لا تعمل على هذا الموقع أي متتبعات إعلانية.</p>",
    "<h2>What we collect</h2>": "<h2>ما الذي نجمعه</h2>",
    "<li><strong>Inquiry details</strong> — what you submit through the contact form or send by email: name, email, company, project description, budget and timeline indications.</li>":
        "<li><strong>تفاصيل الطلب</strong> — ما تقدمه عبر نموذج التواصل أو البريد: الاسم، البريد، الشركة، وصف المشروع، ومؤشرات الميزانية والتوقيت.</li>",
    "<li><strong>Booking details</strong> — if you book a call, our scheduling provider processes your name, email and chosen slot under its own privacy policy.</li>":
        "<li><strong>تفاصيل الحجز</strong> — إذا حجزت مكالمة، يعالج مزوّد الجدولة اسمك وبريدك والموعد المختار وفق سياسته الخاصة للخصوصية.</li>",
    "<li><strong>Anonymous usage data</strong> — if privacy-friendly analytics are enabled, we see aggregate page views and events without cookies and without identifying you personally.</li>":
        "<li><strong>بيانات استخدام مجهولة</strong> — إذا فُعّلت تحليلات صديقة للخصوصية، نرى مشاهدات وأحداثًا مجمّعة دون كوكيز ودون تحديد هويتك.</li>",
    "<h2>What we do with it</h2>": "<h2>ما الذي نفعله بها</h2>",
    "<p>We use your information to respond to your inquiry, prepare proposals, and deliver engagements. Legal basis: your consent when contacting us, and contract performance once we work together.</p>":
        "<p>نستخدم معلوماتك للرد على طلبك وإعداد العروض وتنفيذ المشاريع. الأساس القانوني: موافقتك عند التواصل، ثم تنفيذ العقد عندما نعمل معًا.</p>",
    "<h2>What we don’t do</h2>": "<h2>ما لا نفعله</h2>",
    "<p>We do not sell, rent or trade your data. We do not run third-party advertising or cross-site tracking. We do not send newsletters you didn’t ask for.</p>":
        "<p>لا نبيع بياناتك ولا نؤجرها ولا نتاجر بها. لا إعلانات من أطراف ثالثة ولا تتبع عبر المواقع. ولا نشرات بريدية لم تطلبها.</p>",
    "<h2>Retention</h2>": "<h2>الاحتفاظ بالبيانات</h2>",
    "<p>Inquiry correspondence is kept for as long as needed to handle your request and for reasonable business records thereafter. Ask us to delete your data at any time.</p>":
        "<p>نحتفظ بمراسلات الطلبات ما دامت معالجتها تتطلب ذلك، ثم لأغراض أرشيفية معقولة. اطلب حذف بياناتك في أي وقت.</p>",
    "<h2>Your rights</h2>": "<h2>حقوقك</h2>",
    "<p>You may request access to, correction of, or deletion of your personal data — in line with Moroccan Law 09-08 and, where applicable, the GDPR. Write to <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a> and we’ll act within 30 days.</p>":
        "<p>يحق لك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها — وفق القانون المغربي 09-08 وكذلك اللائحة الأوروبية GDPR عند الاقتضاء. راسلنا على <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a> وسنستجيب خلال 30 يومًا.</p>",
    "<h2>Contact</h2>": "<h2>التواصل</h2>",
    "<p>THE’Y Studio Design, Casablanca, Morocco — <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a></p>":
        "<p>THE’Y ستوديو ديزاين، الدار البيضاء، المغرب — <a class=\"link-u\" href=\"mailto:hello@theystudiodesign.com\">hello@theystudiodesign.com</a></p>",

    # ===== الشروط =====
    "Terms of use": "شروط الاستخدام",
    "<h2>The website</h2>": "<h2>الموقع</h2>",
    "<p>theystudiodesign.com is published by THE’Y Studio Design, Casablanca, Morocco. By using this site you accept these terms.</p>":
        "<p>يُنشر theystudiodesign.com من قبل THE’Y ستوديو ديزاين، الدار البيضاء، المغرب. باستخدامك هذا الموقع فأنت تقبل هذه الشروط.</p>",
    "<h2>Intellectual property</h2>": "<h2>الملكية الفكرية</h2>",
    "<p>All content on this site — texts, designs, case studies, imagery, the THE’Y wordmark and visual identity — belongs to THE’Y Studio Design or its clients, and may not be reproduced without written permission. Client work is shown with permission and remains the property of the respective clients where agreed.</p>":
        "<p>كل محتوى هذا الموقع — النصوص والتصاميم ودراسات الحالة والصور وشعار THE’Y والهوية البصرية — ملك لـ THE’Y ستوديو ديزاين أو لعملائه، ولا يجوز نسخه دون إذن كتابي. تُعرض أعمال العملاء بإذن وتبقى ملكًا لأصحابها حيثما اتُّفق.</p>",
    "<h2>Case studies</h2>": "<h2>دراسات الحالة</h2>",
    "<p>Case studies describe real engagements as accurately as reasonably possible. Results depend on many factors; nothing on this site constitutes a guarantee of outcomes for future engagements.</p>":
        "<p>تصف دراسات الحالة مشاريع حقيقية بأدق ما يمكن عمليًا. تعتمد النتائج على عوامل كثيرة؛ ولا شيء في هذا الموقع يشكل ضمانًا لنتائج مشاريع مقبلة.</p>",
    "<h2>No professional advice</h2>": "<h2>ليس استشارة مهنية</h2>",
    "<p>Content on this site is provided for general information and does not constitute professional advice. Engagements are governed exclusively by the individual proposal and agreement signed for each project.</p>":
        "<p>محتوى هذا الموقع للمعلومات العامة ولا يشكل استشارة مهنية. تخضع المشاريع حصريًا للعرض والعقد الموقعين لكل مشروع.</p>",
    "<h2>Liability</h2>": "<h2>المسؤولية</h2>",
    "<p>This site is provided “as is.” To the extent permitted by law, THE’Y Studio Design accepts no liability for damages arising from the use of this site or of third-party sites it links to.</p>":
        "<p>يُقدَّم هذا الموقع «كما هو». وفي الحدود التي يسمح بها القانون، لا يتحمل THE’Y ستوديو ديزاين أي مسؤولية عن أضرار ناتجة عن استخدام هذا الموقع أو مواقع الأطراف الثالثة التي يحيل إليها.</p>",
    "<h2>Governing law</h2>": "<h2>القانون المعمول به</h2>",
    "<p>These terms are governed by the laws of the Kingdom of Morocco. Any dispute falls under the jurisdiction of the courts of Casablanca.</p>":
        "<p>تخضع هذه الشروط لقوانين المملكة المغربية. ويعود الاختصاص في أي نزاع لمحاكم الدار البيضاء.</p>",
}
