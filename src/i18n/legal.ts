import { Language } from '.';

export type LegalDoc = 'privacy' | 'terms';
export interface LegalSection {
    title: string;
    body: string;
}
interface LegalText {
    title: string;
    intro: string;
    sections: LegalSection[];
}

/** Address shown in both documents and used by the Contact rows. */
export const SUPPORT_EMAIL = 'checcofran717@gmail.com';

/** Date shown under the title; bump it whenever the texts change. */
export const LEGAL_UPDATED = '2026-10-07';

const en: Record<LegalDoc, LegalText> = {
    privacy: {
        title: 'Privacy policy',
        intro: 'UniStats is built to work entirely on your phone. We do not collect, sell or share your personal data.',
        sections: [
            {
                title: 'What stays on your device',
                body: 'Your name, degree, university, exams, grades, notes and settings are saved only in the app’s local storage on this device. They never leave it unless you share them yourself.',
            },
            {
                title: 'Transcript import',
                body: 'When you import a PDF transcript, the file is read and analysed on the device. It is not uploaded to any server and the app keeps only the exams you confirm.',
            },
            {
                title: 'No account, no tracking',
                body: 'UniStats has no sign-up, no analytics, no advertising and no third-party tracking SDKs. The app does not need an internet connection to work.',
            },
            {
                title: 'Permissions',
                body: 'The app asks to access a file only when you choose one to import. It does not access your contacts, location, camera or photos.',
            },
            {
                title: 'Donations',
                body: 'Donations are optional in-app purchases processed entirely by Apple. We never see your name, card or Apple ID: we only learn that a donation was made.',
            },
            {
                title: 'Deleting your data',
                body: 'You can erase everything at any time from Profile › Reset all data, or by uninstalling the app. Device backups (iCloud or Google) may contain a copy according to your system settings.',
            },
            {
                title: 'Changes',
                body: 'If this policy changes, the new version will be shown in the app with its update date.',
            },
            { title: 'Contact', body: `For any question about your data or these terms, write to ${SUPPORT_EMAIL}.` },
        ],
    },
    terms: {
        title: 'Terms of use',
        intro: 'By using UniStats you accept these terms. Please read them: they explain what the numbers in the app mean.',
        sections: [
            {
                title: 'Estimates, not official grades',
                body: 'Averages, graduation bases and predicted final grades are estimates computed from the data you enter and from the rules you select. Only your university’s official records are valid.',
            },
            {
                title: 'Rules vary by course',
                body: 'Each university, and often each degree course and enrolment year, has its own regulations (lode value, dropped grades, bonuses, thesis points). The presets are based on public documents and may be incomplete or out of date: always check with your course regulations or student office.',
            },
            {
                title: 'Your responsibility',
                body: 'You are responsible for the accuracy of the exams and rules you enter and for any decision you take based on the results.',
            },
            {
                title: 'No warranty',
                body: 'The app is provided “as is”, without warranties of any kind. To the extent permitted by law, the developer is not liable for damages arising from its use or from errors in the calculations.',
            },
            {
                title: 'Intellectual property',
                body: 'The UniStats name, logo, design and code belong to the developer. University names are used only to identify the institutions and do not imply any endorsement.',
            },
            {
                title: 'Changes',
                body: 'These terms may be updated. Continuing to use the app after an update means you accept the new version.',
            },
            { title: 'Contact', body: `For any question about your data or these terms, write to ${SUPPORT_EMAIL}.` },
        ],
    },
};

const it: Record<LegalDoc, LegalText> = {
    privacy: {
        title: 'Privacy',
        intro: 'UniStats è pensata per funzionare interamente sul tuo telefono. Non raccogliamo, vendiamo né condividiamo i tuoi dati personali.',
        sections: [
            {
                title: 'Cosa resta sul tuo dispositivo',
                body: 'Nome, corso, ateneo, esami, voti, note e impostazioni sono salvati solo nella memoria locale dell’app su questo dispositivo. Non escono mai, a meno che non sia tu a condividerli.',
            },
            {
                title: 'Importazione del libretto',
                body: 'Quando importi un libretto in PDF, il file viene letto e analizzato sul dispositivo. Non viene caricato su nessun server e l’app conserva solo gli esami che confermi.',
            },
            {
                title: 'Nessun account, nessun tracciamento',
                body: 'UniStats non ha registrazione, statistiche d’uso, pubblicità né SDK di tracciamento di terze parti. L’app funziona anche senza connessione a internet.',
            },
            {
                title: 'Permessi',
                body: 'L’app accede a un file solo quando sei tu a sceglierlo per l’importazione. Non accede a contatti, posizione, fotocamera o foto.',
            },
            {
                title: 'Donazioni',
                body: 'Le donazioni sono acquisti in-app facoltativi gestiti interamente da Apple. Non vediamo mai il tuo nome, la tua carta o il tuo Apple ID: sappiamo solo che una donazione è stata fatta.',
            },
            {
                title: 'Cancellare i dati',
                body: 'Puoi cancellare tutto in qualsiasi momento da Profilo › Cancella tutti i dati, oppure disinstallando l’app. I backup del dispositivo (iCloud o Google) possono contenerne una copia secondo le tue impostazioni di sistema.',
            },
            {
                title: 'Modifiche',
                body: 'Se questa informativa cambia, la nuova versione sarà mostrata nell’app con la data di aggiornamento.',
            },
            { title: 'Contatti', body: `Per qualsiasi domanda sui tuoi dati o su questi termini scrivi a ${SUPPORT_EMAIL}.` },
        ],
    },
    terms: {
        title: 'Termini e condizioni',
        intro: 'Usando UniStats accetti questi termini. Leggili: spiegano cosa significano i numeri che vedi nell’app.',
        sections: [
            {
                title: 'Stime, non voti ufficiali',
                body: 'Medie, basi di laurea e voti finali previsti sono stime calcolate dai dati che inserisci e dalle regole che scegli. Fanno fede solo i documenti ufficiali del tuo ateneo.',
            },
            {
                title: 'Le regole cambiano da corso a corso',
                body: 'Ogni ateneo, e spesso ogni corso e anno di immatricolazione, ha il suo regolamento (valore della lode, voti scartati, bonus, punti tesi). I preset si basano su documenti pubblici e possono essere incompleti o non aggiornati: verifica sempre con il regolamento del tuo corso o con la segreteria.',
            },
            {
                title: 'La tua responsabilità',
                body: 'Sei responsabile della correttezza degli esami e delle regole che inserisci e delle decisioni che prendi in base ai risultati.',
            },
            {
                title: 'Nessuna garanzia',
                body: 'L’app è fornita “così com’è”, senza garanzie di alcun tipo. Nei limiti consentiti dalla legge, lo sviluppatore non risponde di danni derivanti dal suo uso o da errori nei calcoli.',
            },
            {
                title: 'Proprietà intellettuale',
                body: 'Il nome, il logo, la grafica e il codice di UniStats appartengono allo sviluppatore. I nomi delle università servono solo a identificare gli atenei e non implicano alcuna approvazione da parte loro.',
            },
            {
                title: 'Modifiche',
                body: 'Questi termini possono essere aggiornati. Continuare a usare l’app dopo un aggiornamento significa accettarne la nuova versione.',
            },
            { title: 'Contatti', body: `Per qualsiasi domanda sui tuoi dati o su questi termini scrivi a ${SUPPORT_EMAIL}.` },
        ],
    },
};

const es: Record<LegalDoc, LegalText> = {
    privacy: {
        title: 'Política de privacidad',
        intro: 'UniStats está pensada para funcionar por completo en tu teléfono. No recopilamos, vendemos ni compartimos tus datos personales.',
        sections: [
            {
                title: 'Lo que se queda en tu dispositivo',
                body: 'Tu nombre, carrera, universidad, exámenes, notas, apuntes y ajustes se guardan solo en el almacenamiento local de la app en este dispositivo. Nunca salen de él, salvo que tú los compartas.',
            },
            {
                title: 'Importación del expediente',
                body: 'Cuando importas un expediente en PDF, el archivo se lee y analiza en el dispositivo. No se sube a ningún servidor y la app guarda solo los exámenes que confirmas.',
            },
            {
                title: 'Sin cuenta, sin rastreo',
                body: 'UniStats no tiene registro, analíticas, publicidad ni SDK de rastreo de terceros. La app funciona sin conexión a internet.',
            },
            {
                title: 'Permisos',
                body: 'La app accede a un archivo solo cuando lo eliges para importarlo. No accede a contactos, ubicación, cámara ni fotos.',
            },
            {
                title: 'Donaciones',
                body: 'Las donaciones son compras dentro de la app opcionales gestionadas por completo por Apple. Nunca vemos tu nombre, tu tarjeta ni tu Apple ID: solo sabemos que se hizo una donación.',
            },
            {
                title: 'Borrar tus datos',
                body: 'Puedes borrarlo todo en cualquier momento desde Perfil › Borrar todos los datos, o desinstalando la app. Las copias de seguridad del dispositivo (iCloud o Google) pueden contener una copia según tus ajustes.',
            },
            {
                title: 'Cambios',
                body: 'Si esta política cambia, la nueva versión se mostrará en la app con su fecha de actualización.',
            },
            { title: 'Contacto', body: `Para cualquier pregunta sobre tus datos o estos términos, escribe a ${SUPPORT_EMAIL}.` },
        ],
    },
    terms: {
        title: 'Términos de uso',
        intro: 'Al usar UniStats aceptas estos términos. Léelos: explican qué significan los números de la app.',
        sections: [
            {
                title: 'Estimaciones, no notas oficiales',
                body: 'Las medias, las bases de graduación y las notas finales previstas son estimaciones calculadas con los datos que introduces y las reglas que eliges. Solo valen los registros oficiales de tu universidad.',
            },
            {
                title: 'Las reglas cambian según la carrera',
                body: 'Cada universidad, y a menudo cada carrera y año de matrícula, tiene su propio reglamento. Los ajustes predefinidos se basan en documentos públicos y pueden estar incompletos o desactualizados: compruébalo siempre con tu secretaría.',
            },
            {
                title: 'Tu responsabilidad',
                body: 'Eres responsable de la exactitud de los exámenes y reglas que introduces y de las decisiones que tomes según los resultados.',
            },
            {
                title: 'Sin garantía',
                body: 'La app se ofrece “tal cual”, sin garantías de ningún tipo. En la medida permitida por la ley, el desarrollador no responde de daños derivados de su uso o de errores en los cálculos.',
            },
            {
                title: 'Propiedad intelectual',
                body: 'El nombre, el logo, el diseño y el código de UniStats pertenecen al desarrollador. Los nombres de las universidades se usan solo para identificarlas y no implican su aprobación.',
            },
            {
                title: 'Cambios',
                body: 'Estos términos pueden actualizarse. Seguir usando la app tras una actualización implica aceptar la nueva versión.',
            },
            { title: 'Contacto', body: `Para cualquier pregunta sobre tus datos o estos términos, escribe a ${SUPPORT_EMAIL}.` },
        ],
    },
};

const fr: Record<LegalDoc, LegalText> = {
    privacy: {
        title: 'Confidentialité',
        intro: 'UniStats est conçue pour fonctionner entièrement sur ton téléphone. Nous ne collectons, ne vendons et ne partageons pas tes données personnelles.',
        sections: [
            { title: 'Ce qui reste sur ton appareil', body: 'Ton prénom, ton cursus, ton université, tes examens, notes, remarques et réglages sont enregistrés uniquement dans le stockage local de l’app sur cet appareil. Ils n’en sortent jamais, sauf si tu les partages toi-même.' },
            { title: 'Import du relevé', body: 'Quand tu importes un relevé en PDF, le fichier est lu et analysé sur l’appareil. Il n’est envoyé à aucun serveur et l’app ne garde que les examens que tu confirmes.' },
            { title: 'Pas de compte, pas de suivi', body: 'UniStats n’a ni inscription, ni statistiques d’usage, ni publicité, ni SDK de suivi tiers. L’app fonctionne sans connexion internet.' },
            { title: 'Autorisations', body: 'L’app accède à un fichier uniquement quand tu le choisis pour l’importer. Elle n’accède pas à tes contacts, ta position, ton appareil photo ni tes photos.' },
            { title: 'Dons', body: 'Les dons sont des achats intégrés facultatifs entièrement gérés par Apple. Nous ne voyons jamais ton nom, ta carte ni ton identifiant Apple : nous savons seulement qu’un don a été fait.' },
            { title: 'Supprimer tes données', body: 'Tu peux tout effacer à tout moment depuis Profil › Effacer toutes les données, ou en désinstallant l’app. Les sauvegardes de l’appareil (iCloud ou Google) peuvent en contenir une copie selon tes réglages.' },
            { title: 'Modifications', body: 'Si cette politique change, la nouvelle version sera affichée dans l’app avec sa date de mise à jour.' },
            { title: 'Contact', body: `Pour toute question sur tes données ou ces conditions, écris à ${SUPPORT_EMAIL}.` },
        ],
    },
    terms: {
        title: 'Conditions d’utilisation',
        intro: 'En utilisant UniStats tu acceptes ces conditions. Lis-les : elles expliquent ce que signifient les chiffres de l’app.',
        sections: [
            { title: 'Des estimations, pas des notes officielles', body: 'Moyennes, bases de diplôme et notes finales prévues sont des estimations calculées à partir des données que tu saisis et des règles que tu choisis. Seuls les documents officiels de ton université font foi.' },
            { title: 'Les règles changent selon la filière', body: 'Chaque université, et souvent chaque filière et année d’inscription, a son propre règlement. Les préréglages s’appuient sur des documents publics et peuvent être incomplets ou dépassés : vérifie toujours auprès du secrétariat.' },
            { title: 'Ta responsabilité', body: 'Tu es responsable de l’exactitude des examens et des règles que tu saisis et des décisions que tu prends sur la base des résultats.' },
            { title: 'Aucune garantie', body: 'L’app est fournie « telle quelle », sans garantie d’aucune sorte. Dans les limites permises par la loi, le développeur n’est pas responsable des dommages liés à son utilisation ou à des erreurs de calcul.' },
            { title: 'Propriété intellectuelle', body: 'Le nom, le logo, le design et le code d’UniStats appartiennent au développeur. Les noms des universités servent uniquement à les identifier et n’impliquent aucune approbation de leur part.' },
            { title: 'Modifications', body: 'Ces conditions peuvent être mises à jour. Continuer à utiliser l’app après une mise à jour vaut acceptation de la nouvelle version.' },
            { title: 'Contact', body: `Pour toute question sur tes données ou ces conditions, écris à ${SUPPORT_EMAIL}.` },
        ],
    },
};

const de: Record<LegalDoc, LegalText> = {
    privacy: {
        title: 'Datenschutz',
        intro: 'UniStats funktioniert vollständig auf deinem Handy. Wir erheben, verkaufen oder teilen keine personenbezogenen Daten.',
        sections: [
            { title: 'Was auf deinem Gerät bleibt', body: 'Name, Studium, Uni, Prüfungen, Noten, Notizen und Einstellungen werden nur im lokalen Speicher der App auf diesem Gerät gesichert. Sie verlassen es nie, außer du teilst sie selbst.' },
            { title: 'Import der Übersicht', body: 'Wenn du eine Leistungsübersicht als PDF importierst, wird die Datei auf dem Gerät gelesen und ausgewertet. Sie wird auf keinen Server hochgeladen, und die App behält nur die Prüfungen, die du bestätigst.' },
            { title: 'Kein Konto, kein Tracking', body: 'UniStats hat keine Registrierung, keine Nutzungsstatistiken, keine Werbung und keine Tracking-SDKs von Dritten. Die App funktioniert auch ohne Internet.' },
            { title: 'Berechtigungen', body: 'Die App greift nur auf eine Datei zu, wenn du sie zum Import auswählst. Sie greift nicht auf Kontakte, Standort, Kamera oder Fotos zu.' },
            { title: 'Spenden', body: 'Spenden sind freiwillige In-App-Käufe, die vollständig von Apple abgewickelt werden. Wir sehen nie deinen Namen, deine Karte oder deine Apple-ID: Wir erfahren nur, dass gespendet wurde.' },
            { title: 'Daten löschen', body: 'Du kannst jederzeit alles unter Profil › Alle Daten löschen entfernen oder die App deinstallieren. Geräte-Backups (iCloud oder Google) können je nach Einstellung eine Kopie enthalten.' },
            { title: 'Änderungen', body: 'Ändert sich diese Erklärung, zeigt die App die neue Version mit ihrem Datum an.' },
            { title: 'Kontakt', body: `Bei Fragen zu deinen Daten oder diesen Bedingungen schreib an ${SUPPORT_EMAIL}.` },
        ],
    },
    terms: {
        title: 'Nutzungsbedingungen',
        intro: 'Mit der Nutzung von UniStats akzeptierst du diese Bedingungen. Lies sie: Sie erklären, was die Zahlen in der App bedeuten.',
        sections: [
            { title: 'Schätzungen, keine offiziellen Noten', body: 'Schnitte, Abschlussbasen und erwartete Abschlussnoten sind Schätzungen aus deinen Eingaben und den gewählten Regeln. Maßgeblich sind nur die offiziellen Unterlagen deiner Uni.' },
            { title: 'Regeln je Studiengang', body: 'Jede Uni, oft jeder Studiengang und jedes Einschreibejahr, hat eigene Regeln. Die Vorlagen beruhen auf öffentlichen Dokumenten und können unvollständig oder veraltet sein: prüfe sie immer beim Studienbüro.' },
            { title: 'Deine Verantwortung', body: 'Du bist für die Richtigkeit der eingegebenen Prüfungen und Regeln und für Entscheidungen auf Grundlage der Ergebnisse verantwortlich.' },
            { title: 'Keine Gewährleistung', body: 'Die App wird „wie besehen“ ohne jede Gewährleistung bereitgestellt. Soweit gesetzlich zulässig, haftet der Entwickler nicht für Schäden durch die Nutzung oder durch Rechenfehler.' },
            { title: 'Geistiges Eigentum', body: 'Name, Logo, Design und Code von UniStats gehören dem Entwickler. Uni-Namen dienen nur der Identifikation und bedeuten keine Billigung durch die Hochschulen.' },
            { title: 'Änderungen', body: 'Diese Bedingungen können aktualisiert werden. Wer die App nach einer Aktualisierung weiter nutzt, akzeptiert die neue Fassung.' },
            { title: 'Kontakt', body: `Bei Fragen zu deinen Daten oder diesen Bedingungen schreib an ${SUPPORT_EMAIL}.` },
        ],
    },
};

const pt: Record<LegalDoc, LegalText> = {
    privacy: {
        title: 'Privacidade',
        intro: 'O UniStats foi feito para funcionar inteiramente no seu celular. Não coletamos, vendemos nem compartilhamos seus dados pessoais.',
        sections: [
            { title: 'O que fica no seu aparelho', body: 'Nome, curso, universidade, exames, notas, anotações e configurações ficam salvos apenas no armazenamento local do app neste aparelho. Eles nunca saem dele, a menos que você mesmo os compartilhe.' },
            { title: 'Importação do histórico', body: 'Quando você importa um histórico em PDF, o arquivo é lido e analisado no aparelho. Ele não é enviado a nenhum servidor e o app guarda só os exames que você confirma.' },
            { title: 'Sem conta, sem rastreamento', body: 'O UniStats não tem cadastro, estatísticas de uso, publicidade nem SDKs de rastreamento de terceiros. O app funciona sem internet.' },
            { title: 'Permissões', body: 'O app acessa um arquivo só quando você o escolhe para importar. Não acessa contatos, localização, câmera nem fotos.' },
            { title: 'Doações', body: 'As doações são compras dentro do app opcionais, processadas inteiramente pela Apple. Nunca vemos seu nome, cartão ou Apple ID: só sabemos que uma doação foi feita.' },
            { title: 'Apagar seus dados', body: 'Você pode apagar tudo a qualquer momento em Perfil › Apagar todos os dados, ou desinstalando o app. Os backups do aparelho (iCloud ou Google) podem conter uma cópia conforme suas configurações.' },
            { title: 'Alterações', body: 'Se esta política mudar, a nova versão será mostrada no app com a data de atualização.' },
            { title: 'Contato', body: `Para qualquer dúvida sobre seus dados ou estes termos, escreva para ${SUPPORT_EMAIL}.` },
        ],
    },
    terms: {
        title: 'Termos de uso',
        intro: 'Ao usar o UniStats você aceita estes termos. Leia: eles explicam o que significam os números do app.',
        sections: [
            { title: 'Estimativas, não notas oficiais', body: 'Médias, bases de formatura e notas finais previstas são estimativas calculadas com os dados que você insere e as regras que escolhe. Valem apenas os registros oficiais da sua universidade.' },
            { title: 'As regras mudam por curso', body: 'Cada universidade, e muitas vezes cada curso e ano de matrícula, tem seu regulamento. As predefinições se baseiam em documentos públicos e podem estar incompletas ou desatualizadas: confirme sempre na secretaria.' },
            { title: 'Sua responsabilidade', body: 'Você é responsável pela exatidão dos exames e regras que insere e pelas decisões que toma com base nos resultados.' },
            { title: 'Sem garantia', body: 'O app é fornecido “como está”, sem garantias de nenhum tipo. Nos limites da lei, o desenvolvedor não responde por danos decorrentes do uso ou de erros nos cálculos.' },
            { title: 'Propriedade intelectual', body: 'Nome, logo, design e código do UniStats pertencem ao desenvolvedor. Os nomes das universidades servem só para identificá-las e não implicam aprovação delas.' },
            { title: 'Alterações', body: 'Estes termos podem ser atualizados. Continuar usando o app após uma atualização significa aceitar a nova versão.' },
            { title: 'Contato', body: `Para qualquer dúvida sobre seus dados ou estes termos, escreva para ${SUPPORT_EMAIL}.` },
        ],
    },
};

const TEXTS: Partial<Record<Language, Record<LegalDoc, LegalText>>> = { en, it, es, fr, de, pt };

export const legalText = (lang: Language, doc: LegalDoc): LegalText => (TEXTS[lang] ?? en)[doc];
