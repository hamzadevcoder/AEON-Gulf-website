/** Policy text copied from the current site (aeon.qrq8.com), effective 12 April 2025. */
export type Block = { type: 'p'; text: string } | { type: 'ul'; items: string[] } | { type: 'h4'; text: string };
export type Section = { title: string; blocks: Block[] };
export type Policy = { slug: string; title: string; effective: string; intro: Block[]; sections: Section[] };

const p = (text: string): Block => ({ type: 'p', text });
const ul = (...items: string[]): Block => ({ type: 'ul', items });
const h4 = (text: string): Block => ({ type: 'h4', text });
const EFFECTIVE = '12 April 2025';
const contactLine = (what: string) => p(`If you have any questions about ${what}, you can contact us at info@aeongulf.com.`);

export const policies: Record<string, Policy> = {
  'privacy-policy': {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    effective: EFFECTIVE,
    intro: [
      p('Aeon Gulf (“we”, “our”, or “us”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website, www.aeongulf.com. By using our site, you consent to the practices described in this policy.'),
    ],
    sections: [
      {
        title: 'Information We Collect',
        blocks: [
          p('We collect personal information when you choose to interact with us through the following forms on our website:'),
          h4('Contact Us Form'),
          ul('Full Name', 'Email Address', 'Message'),
          h4('Get a Quote Form'),
          ul('Full Name', 'Email Address', 'Phone Number', 'Company Name', 'Selected Services', 'Project Type', 'Address, City, Country', 'Budget', 'Project Description'),
          p('We do not collect any financial or sensitive personal data.'),
        ],
      },
      {
        title: 'How We Use Your Information',
        blocks: [
          p('We use the collected information to:'),
          ul('Respond to your inquiries and provide customer support', 'Send requested quotes and project-related communication', 'Understand user interest to improve our services and website'),
          p('Your data will not be sold or used for unsolicited marketing.'),
        ],
      },
      {
        title: 'Cookies and Analytics',
        blocks: [
          p('Our website may use cookies or similar technologies to enhance your browsing experience.'),
          p('We may, in the future, implement third-party analytics tools such as Google Analytics to:'),
          ul('Analyze user behavior on our site', 'Measure website performance', 'Improve our digital services'),
          p('You can manage or disable cookies through your browser settings at any time.'),
        ],
      },
      {
        title: 'Data Sharing and Third Parties',
        blocks: [
          p('Your information may be processed or stored through third-party services required for operating our website and responding to your inquiries. These may include:'),
          ul('Website hosting (GoDaddy)', 'Email service providers', 'Future analytics tools (e.g., Google Analytics)'),
          p('We ensure any third-party services we use follow secure data handling practices.'),
        ],
      },
      {
        title: 'Data Retention',
        blocks: [
          p('We retain your personal data only for as long as necessary to fulfill the purpose for which it was collected or to comply with applicable legal or administrative requirements.'),
          p('If you wish to have your personal data removed from our records, you may request deletion by contacting us at info@aeongulf.com.'),
        ],
      },
      {
        title: 'Your Rights',
        blocks: [
          p('You have the right to:'),
          ul('Access the data we hold about you', 'Request corrections or deletion of your personal data', 'Withdraw your consent at any time'),
          p('To exercise these rights, please contact us at info@aeongulf.com.'),
        ],
      },
      {
        title: 'Data Security',
        blocks: [p('We take reasonable technical and organizational precautions to prevent the loss, misuse, or alteration of your personal information. However, no method of transmission over the internet is 100% secure.')],
      },
      {
        title: 'International Considerations',
        blocks: [p('As we serve users in Kuwait, Saudi Arabia, and Qatar, your data may be processed in jurisdictions where privacy laws may differ. By using our site, you acknowledge and agree to such cross-border data processing.')],
      },
      {
        title: 'Policy Updates',
        blocks: [p('We may update this Privacy Policy from time to time to reflect changes to our practices or for legal reasons. Any changes will be posted on this page with an updated date.')],
      },
      { title: 'Contact Us', blocks: [p('For any questions about this Privacy Policy or how we handle your data, please contact us at info@aeongulf.com.')] },
    ],
  },
  'terms-and-conditions': {
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    effective: EFFECTIVE,
    intro: [
      p('Welcome to www.aeongulf.com (“Website”), operated by Aeon Gulf (“we”, “us”, or “our”). By accessing or using our Website, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the Website.'),
    ],
    sections: [
      { title: 'Website Use', blocks: [p('This Website is intended to provide general information about our services and allow users to contact us or request a quote. You may use this Website only for lawful purposes and in accordance with these Terms.')] },
      {
        title: 'Information You Provide',
        blocks: [
          p('By submitting information through our Contact Us or Get a Quote forms, you:'),
          ul('Confirm that the information is accurate and complete', 'Authorize us to contact you in response to your inquiry', 'Understand that the information may be stored and processed to fulfill your request, in line with our Privacy Policy'),
          p('You must not use false or misleading information or impersonate another individual or entity.'),
        ],
      },
      {
        title: 'Intellectual Property',
        blocks: [
          p('All content on this Website—including text, graphics, logos, images, videos, and website design—is the property of Aeon Gulf or its licensors and is protected by applicable copyright and intellectual property laws.'),
          p('You may not reproduce, distribute, modify, or use any content without prior written consent from Aeon Gulf.'),
        ],
      },
      { title: 'Website Availability', blocks: [p('We strive to ensure our Website is always accessible, but we do not guarantee uninterrupted access. We may suspend or restrict access for updates, maintenance, or other reasons without notice.')] },
      { title: 'External Links', blocks: [p('Our Website may contain links to third-party websites or services. These links are provided for convenience only. We do not endorse and are not responsible for the content or practices of any third-party sites.')] },
      {
        title: 'Disclaimer',
        blocks: [
          p('All content on this Website is provided for informational purposes only. While we make reasonable efforts to keep the information up to date and accurate, we do not warrant its completeness, reliability, or suitability for any purpose.'),
          p('You use the Website at your own risk. Aeon Gulf shall not be held liable for any loss or damage resulting from your reliance on information from this Website.'),
        ],
      },
      { title: 'Limitation of Liability', blocks: [p('To the maximum extent permitted by law, Aeon Gulf shall not be liable for any direct, indirect, incidental, or consequential damages arising out of or related to your use of the Website.')] },
      { title: 'Governing Law', blocks: [p('These Terms and your use of the Website shall be governed by and construed in accordance with the laws of Kuwait, Saudi Arabia, and Qatar, depending on your location or the applicable jurisdiction. Any disputes shall be resolved under the relevant jurisdiction’s laws.')] },
      { title: 'Modifications', blocks: [p('We reserve the right to update or change these Terms and Conditions at any time. Changes will be posted on this page with the updated date. Your continued use of the Website after any changes constitutes your acceptance of the new terms.')] },
      { title: 'Contact Us', blocks: [contactLine('these Terms and Conditions')] },
    ],
  },
  'cookies-policy': {
    slug: 'cookies-policy',
    title: 'Cookies Policy',
    effective: EFFECTIVE,
    intro: [
      p('This Cookies Policy explains how Aeon Gulf (“we”, “our”, or “us”) uses cookies and similar technologies on our website www.aeongulf.com (“Website”).'),
      p('By continuing to use our Website, you agree to our use of cookies as described below.'),
    ],
    sections: [
      {
        title: 'What Are Cookies?',
        blocks: [
          p('Cookies are small text files stored on your device (computer, phone, tablet) when you visit a website. They help websites remember your preferences, improve performance, and deliver a better user experience.'),
          p('Cookies can be:'),
          ul('Session cookies, which are temporary and deleted when you close your browser.', 'Persistent cookies, which remain on your device until they expire or are deleted manually.'),
        ],
      },
      {
        title: 'How We Use Cookies',
        blocks: [
          p('At present, our use of cookies is minimal and limited to those necessary for the proper operation of the website, which may include:'),
          ul('Essential cookies: Required for core functionality (e.g., security, form submissions, and page navigation)', 'Performance cookies: May be added in the future to analyze how visitors use our site (e.g., Google Analytics)'),
          p('We do not use cookies for advertising, remarketing, or tracking your activity across other websites.'),
        ],
      },
      {
        title: 'Third-Party Cookies',
        blocks: [
          p('In the future, we may integrate third-party services such as:'),
          ul('Google Analytics to understand how users interact with our website', 'Other analytics or optimization tools to improve performance'),
          p('These services may set their own cookies according to their privacy policies.'),
        ],
      },
      {
        title: 'How to Manage Cookies',
        blocks: [
          p('You can control or disable cookies through your browser settings. Most browsers allow you to:'),
          ul('View which cookies are stored', 'Delete cookies individually or in bulk', 'Block third-party or all cookies', 'Set notifications before cookies are placed'),
          p('Please note: Disabling cookies may affect certain functionalities of the Website.'),
        ],
      },
      { title: 'Changes to This Policy', blocks: [p('We may update this Cookies Policy to reflect changes in technology, law, or how we use cookies. All changes will be posted here with the revised date.')] },
      { title: 'Contact Us', blocks: [contactLine('our use of cookies')] },
    ],
  },
};
