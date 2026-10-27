"""Original supplementary grammar topics and exercises for Lernbuddy."""

ENGLISH_EXERCISE_EXTENSIONS: dict[str, list[dict[str, str | list[str]]]] = {
    "present-simple": [
        {
            "question": "Our science teacher ___ experiments every Friday.",
            "options": ["do", "does", "is doing"],
            "answer": "does",
            "explanation": "A singular subject takes the Present Simple form ending in -s.",
        },
        {
            "question": "Which sentence describes a regular habit?",
            "options": [
                "Nora is walking to school right now.",
                "Nora walks to school most mornings.",
                "Nora walked to school yesterday.",
            ],
            "answer": "Nora walks to school most mornings.",
            "explanation": "The Present Simple describes routines and repeated actions.",
        },
    ],
    "past-simple": [
        {
            "question": "The class ___ a model bridge for the project last week.",
            "options": ["build", "built", "has built"],
            "answer": "built",
            "explanation": "A finished event at a stated past time takes the Past Simple.",
        },
        {
            "question": "Which question is formed correctly?",
            "options": [
                "Did Sam found the answer?",
                "Did Sam find the answer?",
                "Found Sam the answer?",
            ],
            "answer": "Did Sam find the answer?",
            "explanation": "After did, use the base form of the main verb.",
        },
    ],
    "present-perfect-intro": [
        {
            "question": "We have ___ the new science museum twice.",
            "options": ["visit", "visited", "visiting"],
            "answer": "visited",
            "explanation": "The Present Perfect is formed with have/has and the past participle.",
        },
        {
            "question": "Which sentence describes an experience without saying when?",
            "options": [
                "I saw that film on Saturday.",
                "I have seen that film before.",
                "I see that film every Saturday.",
            ],
            "answer": "I have seen that film before.",
            "explanation": "Use the Present Perfect for an experience when the exact time is not given.",
        },
    ],
    "first-conditional": [
        {
            "question": "If the weather ___ sunny, we will have lunch outside.",
            "options": ["stays", "will stay", "stayed"],
            "answer": "stays",
            "explanation": "Use the Present Simple in the if-clause of a likely future condition.",
        },
        {
            "question": "Choose the correct result clause: If I finish early, ...",
            "options": ["I will help you.", "I would helped you.", "I help you yesterday."],
            "answer": "I will help you.",
            "explanation": "The first conditional commonly uses will + base verb in the result clause.",
        },
    ],
}

FRENCH_TOPICS: list[dict[str, object]] = [
    {
        "slug": "fr-etre-avoir-present",
        "title": "Être et avoir au présent",
        "language": "fr",
        "cefr_level": "A1",
        "grades": [6, 7],
        "summary": "Die Verben être (sein) und avoir (haben) in einfachen Aussagen verwenden.",
        "explanation": "Être und avoir sind unregelmäßige Verben und gehören zu den wichtigsten französischen Verben. Lerne die Formen am besten zusammen mit dem Personalpronomen: je suis (ich bin), tu es (du bist), il/elle est (er/sie ist); j’ai (ich habe), tu as (du hast), il/elle a (er/sie hat). Vor einem Vokal wird je zu j’, zum Beispiel j’ai.",
        "formation": [
            "être: je suis, tu es, il/elle est, nous sommes, vous êtes, ils/elles sont.",
            "avoir: j’ai, tu as, il/elle a, nous avons, vous avez, ils/elles ont.",
            "Bei avoir wird je vor einem Vokal zu j’: j’ai.",
        ],
        "usage": [
            "être beschreibt Identität und Eigenschaften: Elle est drôle.",
            "avoir beschreibt Besitz und steht in Altersangaben: Il a douze ans.",
        ],
        "examples": [
            {"sentence": "Nous sommes prêts.", "note": "Sommes ist die nous-Form von être."},
            {"sentence": "J’ai un frère.", "note": "Avoir steht hier für Besitz."},
        ],
        "exceptions": ["Die Formen von être und avoir lassen sich nicht durch eine regelmäßige Endungsregel ableiten."],
        "common_mistakes": [
            "Nicht: Je suis douze ans. Richtig: J’ai douze ans.",
            "Nicht: Tu est. Richtig: Tu es.",
        ],
        "related_topics": ["fr-articles-gender", "fr-er-verbs-present"],
        "exercises": [
            {"question": "Complète : Je ___ en sixième.", "options": ["suis", "ai", "est"], "answer": "suis", "explanation": "Je suis ist die passende Form von être zu je."},
            {"question": "Complète : Lina ___ un petit chien.", "options": ["est", "a", "as"], "answer": "a", "explanation": "Avoir drückt hier Besitz aus; zu Lina passt die Form a."},
            {"question": "Wie sagt man „Wir sind hier“?", "options": ["Nous avons ici.", "Nous sommes ici.", "Nous êtes ici."], "answer": "Nous sommes ici.", "explanation": "Die nous-Form von être lautet sommes."},
            {"question": "Complète : Vous ___ quel âge ?", "options": ["êtes", "avez", "ont"], "answer": "avez", "explanation": "Für Altersangaben verwendet man avoir: vous avez."},
        ],
    },
    {
        "slug": "fr-articles-gender",
        "title": "Artikel und Nomen: un, une, le, la",
        "language": "fr",
        "cefr_level": "A1",
        "grades": [6, 7],
        "summary": "Begleiter passend zum grammatischen Geschlecht und zur Anzahl wählen.",
        "explanation": "Französische Nomen haben ein grammatisches Geschlecht. Un und le stehen bei männlichen Nomen, une und la bei weiblichen Nomen. Im Plural verwendet man les. Vor einem Vokal oder stummem h werden le und la zu l’: l’école. Das Geschlecht eines Nomens sollte man zusammen mit dem Artikel lernen.",
        "formation": [
            "un / une: unbestimmter Artikel im Singular.",
            "le / la: bestimmter Artikel im Singular; les im Plural.",
            "Vor einem Vokal: l’ami, l’école.",
        ],
        "usage": [
            "Einen Gegenstand erstmals oder unbestimmt nennen: un livre, une trousse.",
            "Über etwas Bestimmtes sprechen: le livre, la trousse.",
        ],
        "examples": [
            {"sentence": "C’est une école.", "note": "École ist weiblich; vor dem Vokal steht l’."},
            {"sentence": "Les élèves arrivent.", "note": "Les gilt für männliche und weibliche Mehrzahl."},
        ],
        "exceptions": ["Der Artikel l’ zeigt das Geschlecht nicht an; es muss beim Nomen mitgelernt werden."],
        "common_mistakes": [
            "Nicht: un table. Richtig: une table.",
            "Nicht: le école. Richtig: l’école.",
        ],
        "related_topics": ["fr-etre-avoir-present"],
        "exercises": [
            {"question": "Choisis : ___ maison est grande.", "options": ["Le", "La", "Les"], "answer": "La", "explanation": "Maison ist feminin Singular, daher la."},
            {"question": "Choisis : J’ai ___ stylo bleu.", "options": ["une", "un", "des"], "answer": "un", "explanation": "Stylo ist maskulin Singular."},
            {"question": "Vor welchem Nomen steht l’?", "options": ["___ école", "___ garçon", "___ tables"], "answer": "___ école", "explanation": "Vor dem Vokal am Anfang von école wird la zu l’."},
            {"question": "Complète : ___ amis jouent dans la cour.", "options": ["Le", "La", "Les"], "answer": "Les", "explanation": "Les ist der bestimmte Artikel für den Plural."},
        ],
    },
    {
        "slug": "fr-er-verbs-present",
        "title": "Regelmäßige Verben auf -er",
        "language": "fr",
        "cefr_level": "A1",
        "grades": [7, 8],
        "summary": "Regelmäßige Verben wie parler im Präsens konjugieren.",
        "explanation": "Bei vielen regelmäßigen Verben auf -er entfernst du die Endung -er und ergänzt die Präsens-Endung. Für parler (sprechen) heißt das: parl- + e, es, e, ons, ez, ent. Die Endung -ent bei ils/elles wird normalerweise nicht gesprochen. Aller endet zwar auf -er, ist aber unregelmäßig.",
        "formation": [
            "Stamm bilden: parler → parl-.",
            "Endungen: je -e, tu -es, il/elle -e, nous -ons, vous -ez, ils/elles -ent.",
            "Beispiel: nous parlons; vous parlez.",
        ],
        "usage": ["Handlungen und Gewohnheiten im Präsens ausdrücken."],
        "examples": [
            {"sentence": "Tu regardes un film.", "note": "Bei tu lautet die Endung -es."},
            {"sentence": "Elles aiment la musique.", "note": "Die Endung -ent wird nicht mitgesprochen."},
        ],
        "exceptions": [
            "Aller ist trotz der Endung -er unregelmäßig: je vais, tu vas, il va.",
            "Bei Verben wie manger bleibt vor der nous-Endung ein e: nous mangeons.",
        ],
        "common_mistakes": [
            "Nicht: nous parlez. Richtig: nous parlons.",
            "Die Endung -ent bei ils/elles nicht als zusätzliche Silbe aussprechen.",
        ],
        "related_topics": ["fr-futur-proche"],
        "exercises": [
            {"question": "Je ___ français en classe.", "options": ["parle", "parles", "parlons"], "answer": "parle", "explanation": "Zu je gehört bei regelmäßigen -er-Verben die Endung -e."},
            {"question": "Nous ___ la radio.", "options": ["écoutez", "écoutons", "écoutent"], "answer": "écoutons", "explanation": "Die nous-Endung lautet -ons."},
            {"question": "Vous ___ très bien.", "options": ["chante", "chantent", "chantez"], "answer": "chantez", "explanation": "Die vous-Endung lautet -ez."},
            {"question": "Welche Form ist unregelmäßig?", "options": ["je joue", "tu regardes", "je vais"], "answer": "je vais", "explanation": "Aller ist unregelmäßig und folgt nicht dem normalen -er-Muster."},
        ],
    },
    {
        "slug": "fr-negation-ne-pas",
        "title": "Verneinung mit ne … pas",
        "language": "fr",
        "cefr_level": "A1",
        "grades": [7, 8],
        "summary": "Einfache Aussagen mit ne … pas verneinen.",
        "explanation": "Im einfachen Satz umschließen ne und pas das konjugierte Verb: Je ne parle pas. Beginnt das Verb mit einem Vokal oder stummem h, wird ne zu n’: Je n’aime pas. In der gesprochenen Alltagssprache fällt ne oft weg; beim Schreiben solltest du die vollständige Form verwenden.",
        "formation": [
            "Subjekt + ne/n’ + konjugiertes Verb + pas.",
            "Vor einem Vokal: ne wird zu n’: Elle n’habite pas ici.",
            "Mit avoir: Nous n’avons pas de vélo.",
        ],
        "usage": ["Aussagen und Antworten verneinen."],
        "examples": [
            {"sentence": "Il ne regarde pas la télé.", "note": "Ne und pas stehen um das konjugierte Verb."},
            {"sentence": "Je n’écoute pas.", "note": "Vor écoute wird ne zu n’."},
        ],
        "exceptions": ["Bei zusammengesetzten Zeiten steht pas nach dem Hilfsverb: Je n’ai pas compris."],
        "common_mistakes": [
            "Nicht: Je ne pas comprends. Richtig: Je ne comprends pas.",
            "Vor einem Vokal nicht das e in ne stehen lassen: n’aime pas.",
        ],
        "related_topics": ["fr-er-verbs-present"],
        "exercises": [
            {"question": "Verneine: Elle parle anglais.", "options": ["Elle ne parle pas anglais.", "Elle parle ne pas anglais.", "Elle n’est parle pas anglais."], "answer": "Elle ne parle pas anglais.", "explanation": "Ne und pas stehen um das konjugierte Verb parle."},
            {"question": "Complète : Je ___ aime ___ les épinards.", "options": ["ne / pas", "n’ / pas", "pas / n’"], "answer": "n’ / pas", "explanation": "Vor aime wird ne zu n’."},
            {"question": "Complète : Nous ___ avons ___ de devoirs.", "options": ["ne / pas", "n’ / pas", "pas / ne"], "answer": "n’ / pas", "explanation": "Vor avons steht n’; pas folgt auf das Verb."},
            {"question": "Wo steht pas im einfachen Satz?", "options": ["Vor dem Subjekt", "Nach dem konjugierten Verb", "Am Satzanfang"], "answer": "Nach dem konjugierten Verb", "explanation": "Das konjugierte Verb steht zwischen ne und pas."},
        ],
    },
    {
        "slug": "fr-futur-proche",
        "title": "Futur proche mit aller",
        "language": "fr",
        "cefr_level": "A2",
        "grades": [8, 9],
        "summary": "Geplante oder unmittelbar bevorstehende Handlungen ausdrücken.",
        "explanation": "Das Futur proche bildest du mit der konjugierten Form von aller und dem Infinitiv des Vollverbs: Je vais visiter Paris. Aller passt sich an das Subjekt an; das folgende Verb bleibt im Infinitiv. Die Form ist besonders nützlich für Pläne und Handlungen, die bald stattfinden.",
        "formation": [
            "Subjekt + aller im Präsens + Infinitiv.",
            "Je vais partir; tu vas partir; elle va partir.",
            "Verneinung: Subjekt + ne/n’ + aller + pas + Infinitiv.",
        ],
        "usage": [
            "Pläne und Absichten ausdrücken.",
            "Eine Handlung ankündigen, die bald passieren wird.",
        ],
        "examples": [
            {"sentence": "Nous allons jouer au basket.", "note": "Allons ist die nous-Form; jouer bleibt im Infinitiv."},
            {"sentence": "Il ne va pas sortir.", "note": "Ne … pas umschließt aller."},
        ],
        "exceptions": ["Aller selbst ist unregelmäßig; lerne seine Präsensformen gesondert."],
        "common_mistakes": [
            "Nicht: Elle va regarde. Richtig: Elle va regarder.",
            "Nicht: Nous allez partir. Richtig: Nous allons partir.",
        ],
        "related_topics": ["fr-er-verbs-present", "fr-negation-ne-pas"],
        "exercises": [
            {"question": "Demain, tu ___ visiter le musée.", "options": ["vas", "va", "allons"], "answer": "vas", "explanation": "Zu tu gehört vas."},
            {"question": "Nous allons ___ une pizza.", "options": ["mangeons", "manger", "manges"], "answer": "manger", "explanation": "Nach der konjugierten Form von aller steht der Infinitiv."},
            {"question": "Wähle die richtige Form: Ils ___ regarder un match.", "options": ["allez", "vont", "va"], "answer": "vont", "explanation": "Zu ils/elles gehört die Form vont."},
            {"question": "Wie verneinst du „Je vais jouer“?", "options": ["Je ne vais pas jouer.", "Je vais ne pas jouer.", "Je ne pas vais jouer."], "answer": "Je ne vais pas jouer.", "explanation": "Ne … pas umschließt die konjugierte Form vais."},
        ],
    },
]
