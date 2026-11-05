// Public privacy policy, one document per locale. The Vietnamese version is the authoritative one
// (the site is operated from Vietnam); the other four are translations for the language switcher.
// Keep the wording aligned with the actual code: Quick Call fields, 12-month lead retention,
// Cloudflare (hosting/D1/R2/Turnstile/logs), Resend (email), Google (owner inbox).
import type { Locale } from '../i18n/config';

export interface PrivacySection {
  heading: string;
  body?: string[];
  bullets?: string[];
  after?: string[];
}

export interface PrivacyDoc {
  title: string;
  description: string;
  kicker: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  authoritative: string;
  footerLabel: string;
  sections: PrivacySection[];
  contactHeading: string;
  contactBody: string;
  contactEmail: string;
}

export const PRIVACY_EMAIL = 'thanhnguyenphotowork@gmail.com';

export const PRIVACY: Record<Locale, PrivacyDoc> = {
  vi: {
    title: 'Chính sách bảo vệ dữ liệu cá nhân',
    description: 'Cách Drafty Lab thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu cá nhân của bạn.',
    kicker: 'Pháp lý',
    updatedLabel: 'Cập nhật lần cuối',
    updated: '06/11/2026',
    intro:
      'Chính sách này giải thích Drafty Lab thu thập những thông tin gì khi bạn gửi yêu cầu qua website, dùng thông tin đó để làm gì, lưu trong bao lâu và bạn có những quyền gì.',
    authoritative:
      'Chính sách này được xây dựng theo pháp luật Việt Nam. Bản tiếng Việt là bản chính; các bản dịch sang ngôn ngữ khác chỉ để tham khảo.',
    footerLabel: 'Chính sách bảo vệ dữ liệu',
    sections: [
      {
        heading: '1. Chúng tôi là ai',
        body: [
          'Drafty Lab là thương hiệu cá nhân do Thành Nguyễn vận hành tại Việt Nam. Trong chính sách này, “Drafty Lab”, “chúng tôi” hoặc “tôi” đều chỉ cá nhân Thành Nguyễn.',
          `Liên hệ về dữ liệu cá nhân: ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '2. Dữ liệu chúng tôi thu thập',
        body: [
          'Khi bạn gửi form “Quick Call in 10 Min”, bạn có thể cung cấp: họ tên, cách liên hệ (số điện thoại, email, Instagram hoặc thông tin khác), lĩnh vực kinh doanh, nhu cầu, hiện trạng triển khai nội dung, ngân sách dự kiến (không bắt buộc) và ghi chú (không bắt buộc).',
          'Một số dữ liệu kỹ thuật được tạo tự động để bảo vệ website: địa chỉ IP được băm một chiều (không lưu IP gốc), mã xác minh Turnstile và nhật ký máy chủ của Cloudflare.',
          'Chúng tôi không chủ động thu thập dữ liệu cá nhân nhạy cảm. Vui lòng không nhập thông tin về sức khỏe, tài chính, tôn giáo, quan điểm chính trị hoặc các dữ liệu nhạy cảm khác vào ô ghi chú.',
        ],
      },
      {
        heading: '3. Mục đích xử lý',
        body: ['Chúng tôi xử lý thông tin bạn gửi cho các mục đích sau:'],
        bullets: [
          'Phản hồi yêu cầu của bạn và liên hệ lại theo cách bạn đã chọn.',
          'Quản lý, theo dõi và sắp xếp các yêu cầu tư vấn.',
          'Ngăn chặn spam, lạm dụng form và bảo vệ website.',
          'Tổng hợp, cải thiện chất lượng dịch vụ ở dạng không nhận diện cá nhân.',
        ],
        after: [
          'Chúng tôi không bán dữ liệu cá nhân và không dùng thông tin bạn gửi để chạy quảng cáo nhắm mục tiêu.',
        ],
      },
      {
        heading: '4. Cơ sở pháp lý',
        body: [
          'Chúng tôi xử lý thông tin bạn gửi dựa trên sự đồng ý của bạn khi bạn tích ô đồng ý và bấm gửi form. Việc xử lý cũng cần thiết để phản hồi yêu cầu mà bạn chủ động gửi cho chúng tôi.',
          'Chính sách này được xây dựng theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP. Khi pháp luật thay đổi, chúng tôi sẽ cập nhật chính sách.',
        ],
      },
      {
        heading: '5. Thời hạn lưu',
        body: [
          'Thông tin liên hệ và nội dung yêu cầu được lưu tối đa 12 tháng kể từ ngày bạn gửi yêu cầu, sau đó sẽ được xóa hoặc ẩn danh, trừ khi pháp luật yêu cầu lưu lâu hơn hoặc bạn đồng ý gia hạn.',
          'Dữ liệu chống spam (băm IP) được lưu ngắn hạn theo cửa sổ chống spam của website. Nhật ký kỹ thuật của Cloudflare được lưu theo chính sách của Cloudflare.',
        ],
      },
      {
        heading: '6. Chia sẻ dữ liệu',
        body: [
          'Chúng tôi chỉ chia sẻ dữ liệu với các nhà cung cấp cần thiết để vận hành website và gửi email: Cloudflare (lưu trữ, cơ sở dữ liệu, Turnstile, nhật ký), Resend (gửi email thông báo) và Google (hộp thư Gmail nhận thông báo).',
          'Các nhà cung cấp này xử lý dữ liệu theo hợp đồng và chính sách của họ; chúng tôi không bán hoặc cho thuê dữ liệu cá nhân.',
        ],
      },
      {
        heading: '7. Chuyển dữ liệu ra nước ngoài',
        body: [
          'Một số nhà cung cấp trên có thể lưu trữ hoặc xử lý dữ liệu ngoài Việt Nam. Khi bạn gửi form, bạn đồng ý với việc chuyển dữ liệu ra nước ngoài như mô tả trong chính sách này.',
          'Chúng tôi áp dụng các biện pháp bảo vệ phù hợp và chỉ chuyển dữ liệu khi cần thiết để cung cấp dịch vụ.',
        ],
      },
      {
        heading: '8. Quyền của bạn',
        body: ['Bạn có quyền:'],
        bullets: [
          'Được biết về việc xử lý dữ liệu cá nhân của mình.',
          'Xem, chỉnh sửa hoặc yêu cầu cung cấp dữ liệu.',
          'Xóa dữ liệu hoặc hạn chế xử lý.',
          'Phản đối việc xử lý và rút lại sự đồng ý bất cứ lúc nào.',
          'Khiếu nại với cơ quan nhà nước có thẩm quyền về bảo vệ dữ liệu cá nhân.',
        ],
      },
      {
        heading: '9. Thời hạn phản hồi yêu cầu',
        body: [
          'Theo Nghị định 356/2025/NĐ-CP, chúng tôi sẽ phản hồi và hướng dẫn thủ tục trong 02 ngày làm việc. Các yêu cầu rút đồng ý, hạn chế hoặc phản đối xử lý được giải quyết trong 15 ngày, tối đa 20 ngày nếu cần bên xử lý hoặc bên thứ ba; yêu cầu xem, chỉnh sửa hoặc cung cấp dữ liệu trong 10 ngày, tối đa 15 ngày; yêu cầu xóa trong 20 ngày, tối đa 30 ngày. Thời hạn có thể gia hạn một lần theo quy định và chúng tôi sẽ thông báo lý do.',
          `Gửi yêu cầu đến ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '10. Bảo mật',
        body: [
          'Website dùng HTTPS, kiểm soát truy cập, giới hạn tần suất gửi form, băm địa chỉ IP và cơ chế đăng nhập quản trị riêng. Không có hệ thống nào an toàn tuyệt đối; nếu phát hiện sự cố ảnh hưởng đến dữ liệu của bạn, chúng tôi sẽ thông báo theo quy định.',
        ],
      },
      {
        heading: '11. Trẻ em',
        body: [
          'Website không hướng đến trẻ em dưới 16 tuổi và chúng tôi không chủ động thu thập dữ liệu của trẻ em. Nếu phát hiện dữ liệu của trẻ em đã được gửi, chúng tôi sẽ xóa.',
        ],
      },
      {
        heading: '12. Cookie và công cụ phân tích',
        body: [
          'Website không dùng cookie quảng cáo và không dùng công cụ phân tích hành vi để nhắm mục tiêu quảng cáo. Cookie kỹ thuật chỉ được dùng khi cần thiết, ví dụ cookie phiên đăng nhập của trang quản trị.',
          'Cloudflare có thể ghi nhật ký kỹ thuật để vận hành, bảo mật và chống lạm dụng.',
        ],
      },
      {
        heading: '13. Thay đổi chính sách',
        body: [
          'Chúng tôi có thể cập nhật chính sách này. Bản mới sẽ được đăng trên trang này với ngày cập nhật mới. Nếu thay đổi ảnh hưởng đáng kể đến quyền của bạn, chúng tôi sẽ thông báo rõ hơn.',
        ],
      },
      {
        heading: '14. Liên hệ và khiếu nại',
        body: [
          'Mọi câu hỏi, yêu cầu hoặc khiếu nại về dữ liệu cá nhân, vui lòng gửi đến email bên dưới. Bạn cũng có quyền khiếu nại đến cơ quan nhà nước có thẩm quyền về bảo vệ dữ liệu cá nhân tại Việt Nam.',
        ],
      },
    ],
    contactHeading: 'Liên hệ',
    contactBody: 'Email nhận yêu cầu về dữ liệu cá nhân:',
    contactEmail: PRIVACY_EMAIL,
  },

  en: {
    title: 'Personal Data Protection Policy',
    description: 'How Drafty Lab collects, uses, stores and protects your personal data.',
    kicker: 'Legal',
    updatedLabel: 'Last updated',
    updated: '6 November 2026',
    intro:
      'This policy explains what information Drafty Lab collects when you send a request through the website, what we use it for, how long we keep it and what rights you have.',
    authoritative:
      'This policy is governed by Vietnamese law. The Vietnamese version is the authoritative version; translations into other languages are for reference only.',
    footerLabel: 'Data protection policy',
    sections: [
      {
        heading: '1. Who we are',
        body: [
          'Drafty Lab is a personal brand operated by Thành Nguyễn in Vietnam. In this policy, “Drafty Lab”, “we”, “us” and “our” refer to Thành Nguyễn as an individual.',
          `Contact for personal data matters: ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '2. Data we collect',
        body: [
          'When you send the “Quick Call in 10 Min” form, you may provide: your name, contact details (phone, email, Instagram or another method), industry, needs, current content setup, estimated budget (optional) and notes (optional).',
          'Some technical data is generated automatically to protect the website: a one-way hashed IP address (the raw IP is not stored), a Turnstile verification token and Cloudflare server logs.',
          'We do not intentionally collect sensitive personal data. Please do not enter health, financial, religious, political or other sensitive information in the notes field.',
        ],
      },
      {
        heading: '3. Why we use it',
        body: ['We use the information you submit for the following purposes:'],
        bullets: [
          'To reply to your request and contact you through the method you chose.',
          'To manage, track and organise consultation requests.',
          'To prevent spam, form abuse and protect the website.',
          'To improve the service in an aggregated, non-identifiable form.',
        ],
        after: ['We do not sell personal data and do not use your information for targeted advertising.'],
      },
      {
        heading: '4. Legal basis',
        body: [
          'We process the information you submit on the basis of your consent when you tick the consent box and send the form. Processing is also necessary to respond to the request you have sent us.',
          'This policy is prepared under the Law on Personal Data Protection No. 91/2025/QH15 and Decree 356/2025/NĐ-CP. We will update it when the law changes.',
        ],
      },
      {
        heading: '5. Retention',
        body: [
          'Contact details and request content are kept for up to 12 months from the date you submitted the request, after which they are deleted or anonymised, unless the law requires a longer period or you agree to an extension.',
          'Anti-spam data (hashed IP) is kept for the short anti-spam window of the website. Cloudflare technical logs are kept according to Cloudflare’s policy.',
        ],
      },
      {
        heading: '6. Sharing',
        body: [
          'We share data only with the providers needed to run the website and send email: Cloudflare (hosting, database, Turnstile, logs), Resend (notification email delivery) and Google (the Gmail inbox that receives notifications).',
          'These providers process data under their contracts and policies; we do not sell or rent personal data.',
        ],
      },
      {
        heading: '7. International transfers',
        body: [
          'Some of these providers may store or process data outside Vietnam. By submitting the form, you agree to the transfer of data abroad as described in this policy.',
          'We apply appropriate safeguards and transfer data only when necessary to provide the service.',
        ],
      },
      {
        heading: '8. Your rights',
        body: ['You have the right to:'],
        bullets: [
          'Be informed about the processing of your personal data.',
          'Access, correct or request a copy of your data.',
          'Delete your data or restrict processing.',
          'Object to processing and withdraw consent at any time.',
          'Complain to the competent Vietnamese authority for personal data protection.',
        ],
      },
      {
        heading: '9. Response times',
        body: [
          'Under Decree 356/2025/NĐ-CP, we will respond and explain the procedure within 2 working days. Requests to withdraw consent, restrict or object to processing are handled within 15 days, up to 20 days if a processor or third party is involved; access, correction or data-supply requests within 10 days, up to 15 days; deletion requests within 20 days, up to 30 days. The period may be extended once as permitted, and we will explain why.',
          `Send requests to ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '10. Security',
        body: [
          'The website uses HTTPS, access controls, form rate limiting, IP hashing and a separate admin login. No system is completely secure; if we detect an incident affecting your data, we will notify you as required by law.',
        ],
      },
      {
        heading: '11. Children',
        body: [
          'The website is not directed at children under 16 and we do not knowingly collect children’s data. If we learn that a child’s data has been submitted, we will delete it.',
        ],
      },
      {
        heading: '12. Cookies and analytics',
        body: [
          'The website does not use advertising cookies or behavioural analytics for ad targeting. Technical cookies are used only when necessary, such as the admin session cookie.',
          'Cloudflare may keep technical logs for operation, security and abuse prevention.',
        ],
      },
      {
        heading: '13. Changes',
        body: [
          'We may update this policy. The new version will be posted on this page with a new update date. If a change significantly affects your rights, we will make it clearer.',
        ],
      },
      {
        heading: '14. Contact and complaints',
        body: [
          'For any question, request or complaint about personal data, please use the email below. You also have the right to complain to the competent Vietnamese authority for personal data protection.',
        ],
      },
    ],
    contactHeading: 'Contact',
    contactBody: 'Email for personal data requests:',
    contactEmail: PRIVACY_EMAIL,
  },

  fr: {
    title: 'Politique de protection des données personnelles',
    description: 'Comment Drafty Lab collecte, utilise, conserve et protège vos données personnelles.',
    kicker: 'Mentions légales',
    updatedLabel: 'Dernière mise à jour',
    updated: '6 novembre 2026',
    intro:
      'La présente politique explique quelles informations Drafty Lab collecte lorsque vous envoyez une demande via le site, ce que nous en faisons, combien de temps nous les conservons et quels sont vos droits.',
    authoritative:
      'La présente politique est régie par le droit vietnamien. La version vietnamienne fait foi ; les traductions dans d’autres langues sont fournies à titre indicatif.',
    footerLabel: 'Protection des données',
    sections: [
      {
        heading: '1. Qui nous sommes',
        body: [
          'Drafty Lab est une marque personnelle exploitée par Thành Nguyễn au Vietnam. Dans la présente politique, « Drafty Lab », « nous » et « notre » désignent Thành Nguyễn, personne physique.',
          `Contact pour les questions relatives aux données personnelles : ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '2. Données collectées',
        body: [
          'Lorsque vous envoyez le formulaire « Quick Call in 10 Min », vous pouvez fournir : votre nom, vos coordonnées (téléphone, e-mail, Instagram ou autre), votre secteur d’activité, vos besoins, votre organisation actuelle, votre budget prévisionnel (facultatif) et vos notes (facultatif).',
          'Certaines données techniques sont générées automatiquement pour protéger le site : une adresse IP hachée à sens unique (l’adresse IP brute n’est pas conservée), un jeton de vérification Turnstile et les journaux du serveur Cloudflare.',
          'Nous ne collectons pas intentionnellement de données personnelles sensibles. Veuillez ne pas saisir d’informations de santé, financières, religieuses, politiques ou autres informations sensibles dans le champ de notes.',
        ],
      },
      {
        heading: '3. Finalités',
        body: ['Nous utilisons les informations que vous envoyez aux fins suivantes :'],
        bullets: [
          'Répondre à votre demande et vous recontacter par le moyen choisi.',
          'Gérer, suivre et organiser les demandes de consultation.',
          'Prévenir le spam, l’usage abusif du formulaire et protéger le site.',
          'Améliorer le service sous une forme agrégée et non identifiable.',
        ],
        after: [
          'Nous ne vendons pas de données personnelles et n’utilisons pas vos informations pour de la publicité ciblée.',
        ],
      },
      {
        heading: '4. Base légale',
        body: [
          'Nous traitons les informations que vous envoyez sur la base de votre consentement lorsque vous cochez la case et envoyez le formulaire. Le traitement est également nécessaire pour répondre à la demande que vous nous avez adressée.',
          'La présente politique est établie conformément à la loi vietnamienne sur la protection des données personnelles n° 91/2025/QH15 et au décret 356/2025/NĐ-CP. Nous la mettrons à jour en cas d’évolution du droit.',
        ],
      },
      {
        heading: '5. Durée de conservation',
        body: [
          'Les coordonnées et le contenu de la demande sont conservés pendant 12 mois maximum à compter de la date d’envoi de la demande, puis supprimés ou anonymisés, sauf obligation légale de conservation plus longue ou accord d’extension de votre part.',
          'Les données anti-spam (IP hachée) sont conservées pendant la courte fenêtre anti-spam du site. Les journaux techniques de Cloudflare sont conservés selon la politique de Cloudflare.',
        ],
      },
      {
        heading: '6. Partage',
        body: [
          'Nous partageons les données uniquement avec les prestataires nécessaires au fonctionnement du site et à l’envoi des e-mails : Cloudflare (hébergement, base de données, Turnstile, journaux), Resend (envoi des e-mails de notification) et Google (la boîte Gmail qui reçoit les notifications).',
          'Ces prestataires traitent les données conformément à leurs contrats et politiques ; nous ne vendons ni ne louons de données personnelles.',
        ],
      },
      {
        heading: '7. Transferts internationaux',
        body: [
          'Certains de ces prestataires peuvent stocker ou traiter des données en dehors du Vietnam. En envoyant le formulaire, vous acceptez le transfert de données à l’étranger tel que décrit dans la présente politique.',
          'Nous appliquons des garanties appropriées et ne transférons les données que lorsque cela est nécessaire à la fourniture du service.',
        ],
      },
      {
        heading: '8. Vos droits',
        body: ['Vous avez le droit de :'],
        bullets: [
          'Être informé du traitement de vos données personnelles.',
          'Accéder à vos données, les rectifier ou en demander une copie.',
          'Supprimer vos données ou limiter le traitement.',
          'Vous opposer au traitement et retirer votre consentement à tout moment.',
          'Déposer une réclamation auprès de l’autorité vietnamienne compétente en matière de protection des données personnelles.',
        ],
      },
      {
        heading: '9. Délais de réponse',
        body: [
          'Conformément au décret 356/2025/NĐ-CP, nous répondrons et expliquerons la procédure dans un délai de 2 jours ouvrables. Les demandes de retrait du consentement, de limitation ou d’opposition sont traitées dans un délai de 15 jours, porté à 20 jours si un sous-traitant ou un tiers intervient ; les demandes d’accès, de rectification ou de fourniture de données dans un délai de 10 jours, porté à 15 jours ; les demandes de suppression dans un délai de 20 jours, porté à 30 jours. Ce délai peut être prolongé une fois dans les conditions prévues, avec justification.',
          `Envoyez vos demandes à ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '10. Sécurité',
        body: [
          'Le site utilise HTTPS, des contrôles d’accès, une limitation de fréquence des formulaires, le hachage des adresses IP et une connexion administrateur distincte. Aucun système n’est totalement sûr ; si nous détectons un incident affectant vos données, nous vous informerons conformément à la loi.',
        ],
      },
      {
        heading: '11. Enfants',
        body: [
          'Le site ne s’adresse pas aux enfants de moins de 16 ans et nous ne collectons pas sciemment leurs données. Si nous apprenons que des données d’enfant ont été envoyées, nous les supprimerons.',
        ],
      },
      {
        heading: '12. Cookies et mesure d’audience',
        body: [
          'Le site n’utilise pas de cookies publicitaires ni d’analyse comportementale à des fins de ciblage publicitaire. Des cookies techniques sont utilisés uniquement lorsque nécessaire, par exemple le cookie de session de l’administration.',
          'Cloudflare peut conserver des journaux techniques pour l’exploitation, la sécurité et la prévention des abus.',
        ],
      },
      {
        heading: '13. Modifications',
        body: [
          'Nous pouvons mettre à jour la présente politique. La nouvelle version sera publiée sur cette page avec une nouvelle date de mise à jour. Si un changement affecte sensiblement vos droits, nous le signalerons plus clairement.',
        ],
      },
      {
        heading: '14. Contact et réclamations',
        body: [
          'Pour toute question, demande ou réclamation relative aux données personnelles, utilisez l’adresse e-mail ci-dessous. Vous avez également le droit de déposer une réclamation auprès de l’autorité vietnamienne compétente en matière de protection des données personnelles.',
        ],
      },
    ],
    contactHeading: 'Contact',
    contactBody: 'E-mail pour les demandes relatives aux données personnelles :',
    contactEmail: PRIVACY_EMAIL,
  },

  de: {
    title: 'Richtlinie zum Schutz personenbezogener Daten',
    description: 'Wie Drafty Lab Ihre personenbezogenen Daten erhebt, verwendet, speichert und schützt.',
    kicker: 'Rechtliches',
    updatedLabel: 'Zuletzt aktualisiert',
    updated: '6. November 2026',
    intro:
      'Diese Richtlinie erklärt, welche Informationen Drafty Lab erhebt, wenn Sie über die Website eine Anfrage senden, wofür wir sie verwenden, wie lange wir sie speichern und welche Rechte Sie haben.',
    authoritative:
      'Diese Richtlinie unterliegt vietnamesischem Recht. Die vietnamesische Fassung ist maßgeblich; Übersetzungen in andere Sprachen dienen nur zur Information.',
    footerLabel: 'Datenschutzrichtlinie',
    sections: [
      {
        heading: '1. Wer wir sind',
        body: [
          'Drafty Lab ist eine persönliche Marke von Thành Nguyễn in Vietnam. In dieser Richtlinie bezeichnen „Drafty Lab“, „wir“ und „uns“ Thành Nguyễn als natürliche Person.',
          `Kontakt in Datenschutzangelegenheiten: ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '2. Welche Daten wir erheben',
        body: [
          'Wenn Sie das Formular „Quick Call in 10 Min“ senden, können Sie Folgendes angeben: Name, Kontaktdaten (Telefon, E-Mail, Instagram oder sonstige Angaben), Branche, Bedarf, aktuelle Content-Organisation, geplantes Budget (optional) und Anmerkungen (optional).',
          'Einige technische Daten werden automatisch zum Schutz der Website erzeugt: eine einseitig gehashte IP-Adresse (die Roh-IP wird nicht gespeichert), ein Turnstile-Verifizierungstoken und Serverprotokolle von Cloudflare.',
          'Wir erheben nicht absichtlich sensible personenbezogene Daten. Bitte geben Sie im Anmerkungsfeld keine Gesundheits-, Finanz-, Religions-, Politik- oder sonstigen sensiblen Daten ein.',
        ],
      },
      {
        heading: '3. Zwecke',
        body: ['Wir verwenden die von Ihnen übermittelten Informationen für folgende Zwecke:'],
        bullets: [
          'Beantwortung Ihrer Anfrage und Kontaktaufnahme über den von Ihnen gewählten Weg.',
          'Verwaltung, Nachverfolgung und Organisation von Beratungsanfragen.',
          'Verhinderung von Spam und Formularmissbrauch sowie Schutz der Website.',
          'Verbesserung des Services in aggregierter, nicht identifizierbarer Form.',
        ],
        after: [
          'Wir verkaufen keine personenbezogenen Daten und verwenden Ihre Informationen nicht für zielgerichtete Werbung.',
        ],
      },
      {
        heading: '4. Rechtsgrundlage',
        body: [
          'Wir verarbeiten die von Ihnen übermittelten Informationen auf Grundlage Ihrer Einwilligung, wenn Sie das Kästchen aktivieren und das Formular absenden. Die Verarbeitung ist außerdem erforderlich, um die von Ihnen gestellte Anfrage zu beantworten.',
          'Diese Richtlinie beruht auf dem vietnamesischen Gesetz zum Schutz personenbezogener Daten Nr. 91/2025/QH15 und dem Dekret 356/2025/NĐ-CP. Bei Gesetzesänderungen werden wir sie aktualisieren.',
        ],
      },
      {
        heading: '5. Speicherdauer',
        body: [
          'Kontaktdaten und Anfrageinhalte werden bis zu 12 Monate ab dem Datum der Anfrage gespeichert und danach gelöscht oder anonymisiert, sofern keine längere gesetzliche Aufbewahrungspflicht besteht oder Sie einer Verlängerung zustimmen.',
          'Anti-Spam-Daten (gehashte IP) werden für das kurze Anti-Spam-Zeitfenster der Website gespeichert. Technische Protokolle von Cloudflare werden nach der Richtlinie von Cloudflare gespeichert.',
        ],
      },
      {
        heading: '6. Weitergabe',
        body: [
          'Wir geben Daten nur an die Anbieter weiter, die für den Betrieb der Website und den E-Mail-Versand erforderlich sind: Cloudflare (Hosting, Datenbank, Turnstile, Protokolle), Resend (Versand von Benachrichtigungs-E-Mails) und Google (das Gmail-Postfach, das Benachrichtigungen erhält).',
          'Diese Anbieter verarbeiten Daten nach ihren Verträgen und Richtlinien; wir verkaufen oder vermieten keine personenbezogenen Daten.',
        ],
      },
      {
        heading: '7. Internationale Übermittlungen',
        body: [
          'Einige dieser Anbieter können Daten außerhalb Vietnams speichern oder verarbeiten. Mit dem Absenden des Formulars stimmen Sie der Übermittlung von Daten ins Ausland wie in dieser Richtlinie beschrieben zu.',
          'Wir wenden geeignete Schutzmaßnahmen an und übermitteln Daten nur, wenn dies für die Erbringung des Services erforderlich ist.',
        ],
      },
      {
        heading: '8. Ihre Rechte',
        body: ['Sie haben das Recht:'],
        bullets: [
          'über die Verarbeitung Ihrer personenbezogenen Daten informiert zu werden.',
          'Auskunft zu erhalten, Ihre Daten zu berichtigen oder eine Kopie zu verlangen.',
          'Ihre Daten löschen zu lassen oder die Verarbeitung einzuschränken.',
          'der Verarbeitung zu widersprechen und Ihre Einwilligung jederzeit zu widerrufen.',
          'sich bei der zuständigen vietnamesischen Behörde für den Schutz personenbezogener Daten zu beschweren.',
        ],
      },
      {
        heading: '9. Antwortfristen',
        body: [
          'Nach dem Dekret 356/2025/NĐ-CP antworten wir innerhalb von 2 Werktagen und erläutern das Verfahren. Anträge auf Widerruf der Einwilligung, Einschränkung oder Widerspruch werden innerhalb von 15 Tagen bearbeitet, bis zu 20 Tagen, wenn ein Auftragsverarbeiter oder Dritter beteiligt ist; Auskunfts-, Berichtigungs- oder Datenbereitstellungsanträge innerhalb von 10 Tagen, bis zu 15 Tagen; Löschanträge innerhalb von 20 Tagen, bis zu 30 Tagen. Die Frist kann nach den Vorschriften einmal verlängert werden; wir nennen den Grund.',
          `Senden Sie Anträge an ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '10. Sicherheit',
        body: [
          'Die Website verwendet HTTPS, Zugriffskontrollen, Ratenbegrenzung für Formulare, IP-Hashing und eine separate Admin-Anmeldung. Kein System ist vollständig sicher; wenn wir einen Vorfall feststellen, der Ihre Daten betrifft, informieren wir Sie nach den gesetzlichen Vorgaben.',
        ],
      },
      {
        heading: '11. Kinder',
        body: [
          'Die Website richtet sich nicht an Kinder unter 16 Jahren und wir erheben wissentlich keine Daten von Kindern. Wenn wir erfahren, dass Daten eines Kindes übermittelt wurden, löschen wir sie.',
        ],
      },
      {
        heading: '12. Cookies und Analyse',
        body: [
          'Die Website verwendet keine Werbe-Cookies und keine Verhaltensanalyse für Werbe-Targeting. Technische Cookies werden nur verwendet, wenn dies erforderlich ist, etwa das Sitzungs-Cookie der Administration.',
          'Cloudflare kann technische Protokolle für Betrieb, Sicherheit und Missbrauchsprävention speichern.',
        ],
      },
      {
        heading: '13. Änderungen',
        body: [
          'Wir können diese Richtlinie aktualisieren. Die neue Fassung wird mit einem neuen Aktualisierungsdatum auf dieser Seite veröffentlicht. Wenn eine Änderung Ihre Rechte wesentlich betrifft, weisen wir deutlicher darauf hin.',
        ],
      },
      {
        heading: '14. Kontakt und Beschwerden',
        body: [
          'Für Fragen, Anträge oder Beschwerden zu personenbezogenen Daten nutzen Sie bitte die untenstehende E-Mail-Adresse. Sie haben außerdem das Recht, sich bei der zuständigen vietnamesischen Behörde für den Schutz personenbezogener Daten zu beschweren.',
        ],
      },
    ],
    contactHeading: 'Kontakt',
    contactBody: 'E-Mail für Datenschutzanfragen:',
    contactEmail: PRIVACY_EMAIL,
  },

  nl: {
    title: 'Privacybeleid voor persoonsgegevens',
    description: 'Hoe Drafty Lab uw persoonsgegevens verzamelt, gebruikt, bewaart en beschermt.',
    kicker: 'Juridisch',
    updatedLabel: 'Laatst bijgewerkt',
    updated: '6 november 2026',
    intro:
      'Dit beleid legt uit welke gegevens Drafty Lab verzamelt wanneer u via de website een aanvraag stuurt, waarvoor wij ze gebruiken, hoe lang wij ze bewaren en welke rechten u hebt.',
    authoritative:
      'Dit beleid valt onder Vietnamees recht. De Vietnamese versie is leidend; vertalingen in andere talen zijn alleen ter informatie.',
    footerLabel: 'Privacybeleid',
    sections: [
      {
        heading: '1. Wie wij zijn',
        body: [
          'Drafty Lab is een persoonlijk merk van Thành Nguyễn in Vietnam. In dit beleid verwijzen „Drafty Lab“, „wij“ en „ons“ naar Thành Nguyễn als natuurlijke persoon.',
          `Contact voor persoonsgegevens: ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '2. Welke gegevens wij verzamelen',
        body: [
          'Wanneer u het formulier „Quick Call in 10 Min“ verstuurt, kunt u het volgende opgeven: naam, contactgegevens (telefoon, e-mail, Instagram of een andere methode), branche, behoeften, huidige contentorganisatie, geschat budget (optioneel) en opmerkingen (optioneel).',
          'Sommige technische gegevens worden automatisch aangemaakt om de website te beschermen: een eenrichtings-gehasht IP-adres (het ruwe IP wordt niet opgeslagen), een Turnstile-verificatietoken en serverlogboeken van Cloudflare.',
          'Wij verzamelen niet bewust bijzondere persoonsgegevens. Voer geen gezondheids-, financiële, religieuze, politieke of andere gevoelige gegevens in het opmerkingenveld in.',
        ],
      },
      {
        heading: '3. Doeleinden',
        body: ['Wij gebruiken de door u verstrekte gegevens voor de volgende doeleinden:'],
        bullets: [
          'Het beantwoorden van uw aanvraag en contact opnemen via de door u gekozen methode.',
          'Het beheren, volgen en ordenen van consultaanvragen.',
          'Het voorkomen van spam en misbruik van het formulier en het beschermen van de website.',
          'Het verbeteren van de dienst in geaggregeerde, niet-identificeerbare vorm.',
        ],
        after: [
          'Wij verkopen geen persoonsgegevens en gebruiken uw gegevens niet voor gerichte advertenties.',
        ],
      },
      {
        heading: '4. Rechtsgrondslag',
        body: [
          'Wij verwerken de door u verstrekte gegevens op basis van uw toestemming wanneer u het vakje aanvinkt en het formulier verstuurt. De verwerking is ook nodig om de aanvraag die u ons stuurt te beantwoorden.',
          'Dit beleid is opgesteld op basis van de Vietnamese wet bescherming persoonsgegevens nr. 91/2025/QH15 en decreet 356/2025/NĐ-CP. Bij wetswijzigingen zullen wij het beleid bijwerken.',
        ],
      },
      {
        heading: '5. Bewaartermijn',
        body: [
          'Contactgegevens en de inhoud van de aanvraag worden maximaal 12 maanden vanaf de datum waarop u de aanvraag hebt verstuurd bewaard en daarna verwijderd of geanonimiseerd, tenzij de wet een langere termijn vereist of u instemt met verlenging.',
          'Antispamgegevens (gehasht IP) worden bewaard voor het korte antispamvenster van de website. Technische logboeken van Cloudflare worden volgens het beleid van Cloudflare bewaard.',
        ],
      },
      {
        heading: '6. Delen',
        body: [
          'Wij delen gegevens alleen met de leveranciers die nodig zijn om de website te laten werken en e-mail te versturen: Cloudflare (hosting, database, Turnstile, logboeken), Resend (verzending van notificatie-e-mails) en Google (de Gmail-inbox die notificaties ontvangt).',
          'Deze leveranciers verwerken gegevens volgens hun contracten en beleid; wij verkopen of verhuren geen persoonsgegevens.',
        ],
      },
      {
        heading: '7. Internationale doorgifte',
        body: [
          'Sommige van deze leveranciers kunnen gegevens buiten Vietnam opslaan of verwerken. Door het formulier te versturen, stemt u in met de doorgifte van gegevens naar het buitenland zoals in dit beleid beschreven.',
          'Wij passen passende waarborgen toe en geven gegevens alleen door wanneer dat nodig is om de dienst te leveren.',
        ],
      },
      {
        heading: '8. Uw rechten',
        body: ['U hebt het recht om:'],
        bullets: [
          'geïnformeerd te worden over de verwerking van uw persoonsgegevens.',
          'inzage te krijgen, uw gegevens te corrigeren of een kopie op te vragen.',
          'uw gegevens te laten verwijderen of de verwerking te beperken.',
          'bezwaar te maken tegen de verwerking en uw toestemming op elk moment in te trekken.',
          'een klacht in te dienen bij de bevoegde Vietnamese autoriteit voor de bescherming van persoonsgegevens.',
        ],
      },
      {
        heading: '9. Reactietermijnen',
        body: [
          'Volgens decreet 356/2025/NĐ-CP reageren wij binnen 2 werkdagen en leggen wij de procedure uit. Verzoeken om intrekking van toestemming, beperking of bezwaar worden binnen 15 dagen behandeld, tot 20 dagen als een verwerker of derde partij betrokken is; verzoeken om inzage, correctie of verstrekking van gegevens binnen 10 dagen, tot 15 dagen; verzoeken om verwijdering binnen 20 dagen, tot 30 dagen. De termijn kan volgens de regels eenmaal worden verlengd; wij melden de reden.',
          `Stuur verzoeken naar ${PRIVACY_EMAIL}.`,
        ],
      },
      {
        heading: '10. Beveiliging',
        body: [
          'De website gebruikt HTTPS, toegangscontrole, snelheidsbeperking voor formulieren, IP-hashing en een aparte beheerderslogin. Geen enkel systeem is volledig veilig; als wij een incident vaststellen dat uw gegevens raakt, informeren wij u zoals de wet vereist.',
        ],
      },
      {
        heading: '11. Kinderen',
        body: [
          'De website is niet gericht op kinderen onder 16 jaar en wij verzamelen niet bewust gegevens van kinderen. Als wij vernemen dat gegevens van een kind zijn ingestuurd, verwijderen wij deze.',
        ],
      },
      {
        heading: '12. Cookies en analyse',
        body: [
          'De website gebruikt geen advertentiecookies en geen gedragsanalyse voor advertentietargeting. Technische cookies worden alleen gebruikt wanneer dat nodig is, bijvoorbeeld de sessiecookie van de beheeromgeving.',
          'Cloudflare kan technische logboeken bewaren voor werking, beveiliging en misbruikpreventie.',
        ],
      },
      {
        heading: '13. Wijzigingen',
        body: [
          'Wij kunnen dit beleid bijwerken. De nieuwe versie wordt met een nieuwe datum op deze pagina geplaatst. Als een wijziging uw rechten wezenlijk beïnvloedt, maken wij dat duidelijker.',
        ],
      },
      {
        heading: '14. Contact en klachten',
        body: [
          'Voor vragen, verzoeken of klachten over persoonsgegevens gebruikt u het onderstaande e-mailadres. U hebt ook het recht om een klacht in te dienen bij de bevoegde Vietnamese autoriteit voor de bescherming van persoonsgegevens.',
        ],
      },
    ],
    contactHeading: 'Contact',
    contactBody: 'E-mail voor verzoeken over persoonsgegevens:',
    contactEmail: PRIVACY_EMAIL,
  },
};
