import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ptcLogo from '../assets/images/logo-ptc.png';
import adminBg from '../assets/images/loginbg.jpg';
import { FiBookOpen, FiEye, FiHeart, FiStar, FiMail, FiPhone, FiEdit2, FiSave, FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';

// ─── Static school data ───────────────────────────────────────────────────────
const MISSION_INTRO = 'Pateros Technological College commits itself to:';

const MISSION_POINTS = [
  'provide quality higher education thru specialized professional instruction;',
  'provide training in scientific, technological, industrial and vocational fields;',
  'enhance moral and spiritual values;',
  'instill the love of country and appreciation of the Filipino cultural heritage;',
  'promote environmental awareness and unconditional love for mother earth;',
  'offer educational opportunities especially to marginalized individuals;',
  'heighten students creativity and leadership through extra and co-curricular activities; and',
  'produce quality graduates adept with technological skills and professional education.',
];

const VISION =
  'A premier technological college recognized for academic excellence, research innovation, and community engagement, producing graduates who lead and inspire positive change in the Philippines and beyond.';

const CORE_VALUES = [
  'Responsibility',
  'Creativity',
  'Integrity',
  'Commitment',
  'Compassion',
  'Excellence',
  'Environment Concern',
];

const ADMINISTRATION = [
  {
    title:    'College President',
    name:     'Dr. Analiza F. Arcega',
    role:     'President',
    initials: 'AA',
    color:    'from-green-700 to-green-500',
    email:    'president@ptc.edu.ph',
    term:     '2017-Present',
    image_url: '',
    phone:    '',
    bio:      'Leads the overall administration and academic direction of Pateros Technological College and oversees institutional excellence and student-centered growth.',
  },
  {
    title:    'Vice President for Academic Affairs',
    name:     'Dr. [VP Academic Affairs]',
    role:     'VPAA',
    initials: 'VP',
    color:    'from-blue-700 to-blue-500',
    email:    'vpaa@ptc.edu.ph',
    phone:    '',
    bio:      'Oversees all academic programs, curriculum development, and faculty development to ensure quality instruction and learning outcomes.',
  },
  {
    title:    'VP for Administration & Finance',
    name:     'Dr. [VP Admin & Finance]',
    role:     'VPAF',
    initials: 'VA',
    color:    'from-indigo-700 to-indigo-500',
    email:    'vpaf@ptc.edu.ph',
    phone:    '',
    bio:      'Manages the administrative and financial operations of the college, ensuring efficient resource allocation and institutional sustainability.',
  },
  {
    title:    'Dean of Student Affairs',
    name:     'Mr./Ms. [Dean of Student Affairs]',
    role:     'Dean',
    initials: 'DS',
    color:    'from-teal-700 to-teal-500',
    email:    'dsa@ptc.edu.ph',
    phone:    '',
    bio:      'Advocates for student welfare, oversees student organizations, discipline, scholarships, and co-curricular development programs.',
  },
  {
    title:    'CESSCA Director',
    name:     'Mr./Ms. [CESSCA Director]',
    role:     'Director',
    initials: 'CD',
    color:    'from-emerald-700 to-emerald-500',
    email:    'cessca@ptc.edu.ph',
    phone:    '',
    bio:      'Leads the Center for Student Services, Cultural & Arts — coordinating student organizations, cultural programs, and student development initiatives.',
  },
  {
    title:    'Registrar',
    name:     'Mr./Ms. [Registrar]',
    role:     'Registrar',
    initials: 'RG',
    color:    'from-purple-700 to-purple-500',
    email:    'registrar@ptc.edu.ph',
    phone:    '',
    bio:      'Manages student registration, enrollment, records, and the issuance of academic credentials.',
  },
];

const FORMER_ADMINISTRATION = [
  {
    name: 'Ms. Angelus D. Ponce',
    title: 'Former PTC Administrator',
    term: '',
    initials: 'AP',
    image_url: '',
    bio: '',
    color: 'from-slate-700 to-slate-500',
  },
  {
    name: 'Ms. Daisy J. Villanueva',
    title: 'Former PTC Administrator',
    term: '',
    initials: 'DV',
    image_url: '',
    bio: '',
    color: 'from-slate-700 to-slate-500',
  },
  {
    name: 'Prof. Estelita Q. Dela Cruz',
    title: 'Former PTC Administrator',
    term: '',
    initials: 'EC',
    image_url: '',
    bio: '',
    color: 'from-slate-700 to-slate-500',
  },
];

const HIMNO_NG_PATEROS = `Bayan ng Pateros, ayon sa kasaysayan
Lahing magiting, kanyang pinagmulan
May Sakahang lupa, may ilog na daluyan
Kinagisnang gawain ay pag-iitikan

KORO
Pateros, Pateros maunlad ang Bayan ko
Sa ekonomiya at yamang pantao
Nakikiisa ako sa mithi at prinsipyo
Pateros, Pateros isusulong
Aking lakas, sipag, talino at tiyaga
Puhunan ng lahat para sa paggawa
May dangal na taglay sa puso't diwa
Mamamayan nya'y huwaran ng madla

KORO 2X
Pateros, Pateros maunlad ang Bayan ko
Sa ekonomiya at yamang pantao
Nakikiisa ako sa mithi at prinsipyo
Pateros, Pateros isusulong
Pateros, Pateros isusulong tagumpay mo`;

const PTC_HYMN = `I
Paaralan naming mahal
Ikaw ang aming patnubay
Tungo sa kinabukasan
Taglay ang karunungan

(KORO)
PTC ikaw ang ilaw
Salamat sa iyong aral
Pagmamahal sa iyo ay taglay
Sa alaala lagi ay buhay

II
PTC ikaw ang gabay
Simbolo ka ng tagumpay
Kabataan ito ang alay
Ligaya'y magulang ang kaakbay
(ulitin ang KORO)`;

const BOARD_OF_TRUSTEES = [
  { tier: 0, name: 'Hon. Mayor Gerald German', title: 'Chairman of the Board', image_url: '', initials: 'GG' },
  { tier: 1, name: 'Dr. Analiza F. Arcega', title: 'College President', image_url: '', initials: 'AA' },
  { tier: 2, name: 'Ms. Santos Bispono', title: 'Representative - DepEd (MMRO)', image_url: '', initials: 'SB' },
  { tier: 2, name: 'Mr. John Mart Ventura', title: 'Site Committee Chairman on Education', image_url: '', initials: 'JV' },
  { tier: 3, name: 'Mr. Robert Santos', title: 'Representative - Business Sector', image_url: '', initials: 'RS' },
  { tier: 3, name: 'Mr. Juanito Bascanto', title: 'PTC Alumni', image_url: '', initials: 'JB' },
  { tier: 3, name: 'Ms. Catherine Peraltas', title: 'Faculty President', image_url: '', initials: 'CP' },
  { tier: 4, name: 'Mr. Rolando G. Baton', title: 'BOT Secretary', image_url: '', initials: 'RB' },
  { tier: 4, name: 'Mr. Timoteo Presott', title: 'SSC President', image_url: '', initials: 'TP' },
  { tier: 4, name: 'Ms. Ruby Villanueva', title: 'NGO Representative Member', image_url: '', initials: 'RV' },
  { tier: 5, name: 'Dr. Raymundo Quintsa', title: 'Additional President', image_url: '', initials: 'RQ' },
  { tier: 5, name: 'Dr. Ruel Tapinas', title: 'CHTB Resource Person', image_url: '', initials: 'RT' },
];

const CERTIFICATES = [];

const FACTS = [
  { value: '1999',    label: 'Year Established' },
  { value: '5,000+', label: 'Enrolled Students' },
  { value: '200+',   label: 'Faculty & Staff' },
  { value: '15+',    label: 'Degree Programs' },
  { value: '20+',    label: 'Student Organizations' },
  { value: '100+',   label: 'School Achievements' },
];

const ABOUT_STORAGE_KEY = 'cessca_about_content_v1';

const DEFAULT_ABOUT_CONTENT = {
  missionIntro: MISSION_INTRO,
  missionPoints: MISSION_POINTS,
  vision: VISION,
  administration: ADMINISTRATION,
  formerAdministration: FORMER_ADMINISTRATION,
  himno: HIMNO_NG_PATEROS,
  ptcHymn: PTC_HYMN,
  boardOfTrustees: BOARD_OF_TRUSTEES,
  certificates: CERTIFICATES,
};

const buildInitials = (name = '') => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'FA';
  return words.slice(0, 2).map((w) => w[0].toUpperCase()).join('');
};

const createFormerAdminTemplate = () => ({
  name: '',
  title: 'Former PTC Administrator',
  term: '',
  initials: 'FA',
  image_url: '',
  bio: '',
  color: 'from-slate-700 to-slate-500',
});

const buildAboutContentFromStorage = (storedRaw) => {
  if (!storedRaw) return DEFAULT_ABOUT_CONTENT;

  try {
    const parsed = JSON.parse(storedRaw);
    return {
      missionIntro: parsed.missionIntro || MISSION_INTRO,
      missionPoints: Array.isArray(parsed.missionPoints) && parsed.missionPoints.length
        ? parsed.missionPoints
        : MISSION_POINTS,
      vision: parsed.vision || VISION,
      administration: Array.isArray(parsed.administration) && parsed.administration.length
        ? parsed.administration
        : ADMINISTRATION,
      formerAdministration: Array.isArray(parsed.formerAdministration) && parsed.formerAdministration.length
        ? parsed.formerAdministration
        : FORMER_ADMINISTRATION,
      himno: parsed.himno || HIMNO_NG_PATEROS,
      ptcHymn: parsed.ptcHymn || PTC_HYMN,
      boardOfTrustees: Array.isArray(parsed.boardOfTrustees) && parsed.boardOfTrustees.length
        ? parsed.boardOfTrustees
        : BOARD_OF_TRUSTEES,
      certificates: Array.isArray(parsed.certificates) ? parsed.certificates : CERTIFICATES,
    };
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
};

const About = () => {
  const { user } = useAuth();
  const { getSetting } = useSettings();
  const canEdit = ['admin', 'cessca_staff'].includes(user?.role);
  const [isEditing, setIsEditing] = useState(false);
  const [aboutContent, setAboutContent] = useState(DEFAULT_ABOUT_CONTENT);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const president = aboutContent.administration[0];
  const formerAdministration = aboutContent.formerAdministration || [];
  const boardOfTrustees = aboutContent.boardOfTrustees || [];
  const certificates = aboutContent.certificates || [];

  useEffect(() => {
    const stored = localStorage.getItem(ABOUT_STORAGE_KEY);
    setAboutContent(buildAboutContentFromStorage(stored));
  }, []);

  const handleSave = () => {
    localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(aboutContent));
    setIsEditing(false);
  };

  const handleCancel = () => {
    const stored = localStorage.getItem(ABOUT_STORAGE_KEY);
    setAboutContent(buildAboutContentFromStorage(stored));
    setIsEditing(false);
  };

  const handleAdminFieldChange = (index, field, value) => {
    setAboutContent((prev) => ({
      ...prev,
      administration: prev.administration.map((admin, i) =>
        i === index ? { ...admin, [field]: value } : admin
      ),
    }));
  };

  const handleFormerAdminFieldChange = (index, field, value) => {
    setAboutContent((prev) => ({
      ...prev,
      formerAdministration: prev.formerAdministration.map((admin, i) =>
        i === index
          ? {
              ...admin,
              [field]: value,
              ...(field === 'name' ? { initials: buildInitials(value) } : {}),
            }
          : admin
      ),
    }));
  };

  const handleAddFormerAdministrators = (count = 1) => {
    setAboutContent((prev) => ({
      ...prev,
      formerAdministration: [
        ...prev.formerAdministration,
        ...Array.from({ length: count }, () => createFormerAdminTemplate()),
      ],
    }));
  };

  const handleRemoveFormerAdministrator = (index) => {
    setAboutContent((prev) => ({
      ...prev,
      formerAdministration: prev.formerAdministration.filter((_, i) => i !== index),
    }));
  };

  const handleBoardMemberFieldChange = (index, field, value) => {
    setAboutContent((prev) => ({
      ...prev,
      boardOfTrustees: prev.boardOfTrustees.map((m, i) =>
        i === index
          ? { ...m, [field]: value, ...(field === 'name' ? { initials: buildInitials(value) } : {}) }
          : m
      ),
    }));
  };

  const handleAddBoardMember = () => {
    setAboutContent((prev) => ({
      ...prev,
      boardOfTrustees: [...prev.boardOfTrustees, { tier: 99, name: '', title: '', image_url: '', initials: 'NM' }],
    }));
  };

  const handleRemoveBoardMember = (index) => {
    setAboutContent((prev) => ({
      ...prev,
      boardOfTrustees: prev.boardOfTrustees.filter((_, i) => i !== index),
    }));
  };

  const handleCertificateFieldChange = (index, field, value) => {
    setAboutContent((prev) => ({
      ...prev,
      certificates: prev.certificates.map((cert, i) => i === index ? { ...cert, [field]: value } : cert),
    }));
  };

  const handleAddCertificate = () => {
    setAboutContent((prev) => ({
      ...prev,
      certificates: [...prev.certificates, { image_url: '', caption: '' }],
    }));
  };

  const handleRemoveCertificate = (index) => {
    setAboutContent((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  return (
    <Layout>
      <div className="space-y-10 pb-8">

        {canEdit && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">About Us Content Manager</p>
              <p className="text-xs text-gray-500">Only admins and CESSCA staff can edit this content.</p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                >
                  <FiEdit2 size={14} /> Edit Content
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                  >
                    <FiSave size={14} /> Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-semibold"
                  >
                    <FiX size={14} /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <div
          className="relative rounded-2xl overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #0f4c1e 0%, #1a6b30 50%, #0d3b17 100%)' }}
        >
          {/* Hex pattern overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="heroHex" width="60" height="52" patternUnits="userSpaceOnUse">
                  <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#heroHex)" />
            </svg>
          </div>
          {/* Gold accent circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 px-8 py-12">
            <div className="flex-shrink-0">
              <div className="bg-white bg-opacity-20 rounded-full p-4 border-4 border-yellow-400 border-opacity-50 shadow-xl">
                <img src={ptcLogo} alt="PTC Logo" className="h-28 w-28 object-contain drop-shadow-md" />
              </div>
            </div>
            <div>
              <p className="text-yellow-400 font-bold text-sm tracking-widest uppercase mb-2">Republic of the Philippines</p>
              <h1 className="text-4xl font-extrabold leading-tight mb-1">Pateros Technological College</h1>
              <p className="text-green-200 text-lg mb-3">Pateros, Metro Manila, Philippines</p>
              <p className="text-green-100 text-sm max-w-2xl">
                A state-funded higher education institution committed to equipping learners with the knowledge, skills,
                and values needed to thrive in a rapidly changing world.
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative z-10 border-t border-green-700 grid grid-cols-3 md:grid-cols-6 divide-x divide-green-700">
            {FACTS.map(({ value, label }) => (
              <div key={label} className="text-center px-4 py-4">
                <p className="text-yellow-300 font-extrabold text-xl leading-none">{value}</p>
                <p className="text-green-200 text-xs mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── MISSION & VISION ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-xl p-3">
                <FiBookOpen className="text-green-700" size={22} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <div className="h-1 w-16 bg-gradient-to-r from-green-600 to-yellow-400 rounded-full mb-4" />
            {isEditing && canEdit ? (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={aboutContent.missionIntro}
                  onChange={(e) => setAboutContent((prev) => ({ ...prev, missionIntro: e.target.value }))}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <textarea
                  rows={10}
                  value={aboutContent.missionPoints.join('\n')}
                  onChange={(e) => setAboutContent((prev) => ({
                    ...prev,
                    missionPoints: e.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                  }))}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed text-sm font-medium">{aboutContent.missionIntro}</p>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-600 text-sm leading-relaxed">
                  {aboutContent.missionPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 rounded-xl p-3">
                <FiEye className="text-yellow-700" size={22} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Our Vision</h2>
            </div>
            <div className="h-1 w-16 bg-gradient-to-r from-yellow-500 to-green-600 rounded-full mb-4" />
            {isEditing && canEdit ? (
              <textarea
                rows={6}
                value={aboutContent.vision}
                onChange={(e) => setAboutContent((prev) => ({ ...prev, vision: e.target.value }))}
                className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            ) : (
              <p className="text-gray-600 leading-relaxed text-sm">{aboutContent.vision}</p>
            )}
          </div>
        </div>

        {/* ── CORE VALUES ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 rounded-xl p-3">
              <FiHeart className="text-purple-700" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Core Values</h2>
              <p className="text-sm text-gray-500">The principles that guide everything we do</p>
            </div>
          </div>
          <ul className="list-disc pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-8 text-gray-700 text-sm">
            {CORE_VALUES.map((value) => (
              <li key={value} className="font-medium">{value}</li>
            ))}
          </ul>
        </div>

        {/* ── ADMINISTRATION ── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 rounded-xl p-3">
            </div>
            <div>
            </div>
          </div>

          {president && (
            <div
              className="relative overflow-hidden rounded-2xl border border-gray-200 mb-6"
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url(${adminBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="px-6 md:px-10 py-8 md:py-10">
                <h3 className="text-white text-3xl md:text-4xl font-semibold tracking-wide mb-5">THE PRESIDENT</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center">
                  <div className="bg-white/10 border border-white/40 rounded-lg p-4 backdrop-blur-sm max-w-sm">
                    {president.image_url ? (
                      <img
                        src={president.image_url}
                        alt={president.name}
                        className="w-full h-auto max-h-[32rem] object-contain rounded-md border border-white/40"
                      />
                    ) : (
                      <div className={`w-full h-80 rounded-md bg-gradient-to-br ${president.color} flex items-center justify-center text-white font-extrabold text-6xl`}>
                        {president.initials}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-md p-5 shadow-xl">
                    {isEditing && canEdit ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={president.title}
                          onChange={(e) => handleAdminFieldChange(0, 'title', e.target.value)}
                          className="w-full text-sm text-gray-700 border border-gray-300 rounded-md px-2 py-1"
                        />
                        <input
                          type="text"
                          value={president.name}
                          onChange={(e) => handleAdminFieldChange(0, 'name', e.target.value)}
                          className="w-full text-base font-semibold text-gray-900 border border-gray-300 rounded-md px-2 py-1"
                        />
                        <input
                          type="text"
                          value={president.term || ''}
                          onChange={(e) => handleAdminFieldChange(0, 'term', e.target.value)}
                          className="w-full text-sm text-gray-700 border border-gray-300 rounded-md px-2 py-1"
                        />
                        <input
                          type="text"
                          value={president.image_url || ''}
                          onChange={(e) => handleAdminFieldChange(0, 'image_url', e.target.value)}
                          placeholder="President photo URL"
                          className="w-full text-sm text-gray-700 border border-gray-300 rounded-md px-2 py-1"
                        />
                        <textarea
                          rows={3}
                          value={president.bio}
                          onChange={(e) => handleAdminFieldChange(0, 'bio', e.target.value)}
                          className="w-full text-sm text-gray-700 border border-gray-300 rounded-md px-2 py-1"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-green-900 text-xl md:text-2xl font-bold uppercase leading-tight">{president.name}</p>
                        <p className="text-green-700 text-base font-medium mt-1">{president.term || '2017-Present'}</p>
                        <p className="text-gray-700 text-sm mt-2">{president.title}</p>
                        <p className="text-gray-600 text-sm mt-3 leading-relaxed">{president.bio}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Non-president administration cards removed as requested */}
        </div>

        {/* ── FORMER ADMINISTRATION ── */}
        <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white text-center">Former PTC Administrator</h2>
            {isEditing && canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddFormerAdministrators(1)}
                  className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                >
                  <FiPlus size={12} /> Add 1
                </button>
                <button
                  type="button"
                  onClick={() => handleAddFormerAdministrators(3)}
                  className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
                >
                  <FiPlus size={12} /> Add 3
                </button>
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {formerAdministration.map((admin, index) => (
              <FormerAdminCard
                key={`${admin.name}-${index}`}
                admin={admin}
                isEditing={isEditing && canEdit}
                onFieldChange={(field, value) => handleFormerAdminFieldChange(index, field, value)}
                onRemove={() => handleRemoveFormerAdministrator(index)}
              />
            ))}
          </div>
        </div>

        {/* ── HIMNO & HYMN ── */}
        <div className="bg-[#0f4c1e] rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-6 py-5 border-b border-gray-800">
            <h2 className="text-2xl font-semibold text-white text-center tracking-wide">School Hymns</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
            {/* Himno ng Pateros */}
            <div className="p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-6">Himno ng Pateros</h3>
              {isEditing && canEdit ? (
                <textarea
                  rows={22}
                  value={aboutContent.himno}
                  onChange={(e) => setAboutContent((prev) => ({ ...prev, himno: e.target.value }))}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <pre className="text-white/85 text-sm leading-8 whitespace-pre-wrap font-sans text-center mx-auto max-w-sm">
                  {aboutContent.himno}
                </pre>
              )}
            </div>
            {/* PTC Hymn */}
            <div className="p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-6">
                <span className=" px-4 py-1 rounded">PTC Hymn</span>
              </h3>
              {isEditing && canEdit ? (
                <textarea
                  rows={22}
                  value={aboutContent.ptcHymn}
                  onChange={(e) => setAboutContent((prev) => ({ ...prev, ptcHymn: e.target.value }))}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <pre className="text-white/85 text-sm leading-8 whitespace-pre-wrap font-sans text-center mx-auto max-w-xs">
                  {aboutContent.ptcHymn}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* ── BOARD OF TRUSTEES ── */}
        <div className="bg-[#0f4c1e] rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex-1 text-center tracking-wide">Board of Trustees</h2>
            {isEditing && canEdit && (
              <button
                type="button"
                onClick={handleAddBoardMember}
                className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
              >
                <FiPlus size={12} /> Add Member
              </button>
            )}
          </div>
          <div className="px-6 py-8 space-y-8">
            {Object.entries(
              boardOfTrustees.reduce((acc, member, i) => {
                const t = member.tier ?? 99;
                if (!acc[t]) acc[t] = [];
                acc[t].push({ ...member, _index: i });
                return acc;
              }, {})
            )
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([tier, members]) => (
                <div key={tier} className="flex justify-center gap-8 flex-wrap">
                  {members.map((member) => (
                    <BotMemberCard
                      key={member._index}
                      member={member}
                      isEditing={isEditing && canEdit}
                      onFieldChange={(field, value) => handleBoardMemberFieldChange(member._index, field, value)}
                      onRemove={() => handleRemoveBoardMember(member._index)}
                    />
                  ))}
                </div>
              ))}
            {boardOfTrustees.length === 0 && !isEditing && (
              <p className="text-gray-500 text-sm text-center py-8">No board members added yet.</p>
            )}
          </div>
        </div>

        {/* ── CERTIFICATES ── */}
        <div className="bg-[#0f4c1e] rounded-2xl overflow-hidden border border-gray-800">
          <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white flex-1 text-center tracking-wide">AWARDS  &amp; CERTIFICATES</h2>
            {isEditing && canEdit && (
              <button
                type="button"
                onClick={handleAddCertificate}
                className="inline-flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold"
              >
                <FiPlus size={12} /> Add Certificate
              </button>
            )}
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
              <CertificateCard
                key={index}
                cert={cert}
                isEditing={isEditing && canEdit}
                onFieldChange={(field, value) => handleCertificateFieldChange(index, field, value)}
                onRemove={() => handleRemoveCertificate(index)}
                onCertificateClick={() => {
                  setSelectedCertificate(cert);
                  setShowCertificateModal(true);
                }}
              />
            ))}
            {certificates.length === 0 && !isEditing && (
              <p className="text-gray-500 text-sm col-span-full text-center py-8">No certificates added yet.</p>
            )}
          </div>
        </div>

        {/* ── CONTACT ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📍</span> Contact & Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-semibold text-gray-800 mb-1">Address</p>
              <p>Pateros Technological College</p>
              <p>P. Bernardo St., Pateros</p>
              <p>Metro Manila, Philippines 1620</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">Communication</p>
              <p className="flex items-center gap-2"><FiPhone size={13} /> (02) 8xxxxx</p>
              <p className="flex items-center gap-2 mt-1"><FiMail size={13} /> info@ptc.edu.ph</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800 mb-1">Office Hours</p>
              <p>Monday – Friday</p>
              <p>8:00 AM – 5:00 PM</p>
              <p className="text-gray-400 text-xs mt-1">Closed on weekends and holidays</p>
            </div>
          </div>
        </div>

        {/* Certificate Modal */}
        {showCertificateModal && selectedCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{selectedCertificate.caption || 'Certificate'}</h2>
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>
              <div className="p-6 flex items-center justify-center bg-gray-50">
                <img 
                  src={selectedCertificate.image_url} 
                  alt={selectedCertificate.caption || 'Certificate'} 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// ─── Admin Card Component ─────────────────────────────────────────────────────
const AdminCard = ({ admin, isEditing, onFieldChange, getSetting }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow min-h-[280px]">
    <div className={`h-3 bg-gradient-to-r ${admin.color}`} />
    <div className="p-6">
      <div className="flex items-start gap-4 mb-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${admin.color} flex items-center justify-center text-white font-bold text-xl shadow-md`}>
          {admin.initials}
        </div>
        <div className="min-w-0 w-full">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={admin.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                className="w-full text-sm font-semibold text-gray-900 border border-gray-300 rounded-md px-2 py-1"
              />
              <input
                type="text"
                value={admin.title}
                onChange={(e) => onFieldChange('title', e.target.value)}
                className="w-full text-xs text-gray-600 border border-gray-300 rounded-md px-2 py-1"
              />
            </div>
          ) : (
            <>
              <p className="font-bold text-gray-900 text-base leading-snug">{admin.name}</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">{admin.title}</p>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={admin.bio}
            onChange={(e) => onFieldChange('bio', e.target.value)}
            className="w-full text-xs text-gray-600 border border-gray-300 rounded-md px-2 py-1"
          />
          <input
            type="email"
            value={admin.email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            className="w-full text-xs text-gray-600 border border-gray-300 rounded-md px-2 py-1"
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 leading-relaxed mb-3">{admin.bio}</p>
          {admin.email && (
            <a
              href={`mailto:${admin.role === 'Director' && getSetting ? getSetting('site_email', admin.email) : admin.email}`}
              className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 font-medium hover:underline transition-colors"
            >
              <FiMail size={14} /> {admin.role === 'Director' && getSetting ? getSetting('site_email', admin.email) : admin.email}
            </a>
          )}
        </>
      )}
    </div>
  </div>
);

const FormerAdminCard = ({ admin, isEditing, onFieldChange, onRemove }) => (
  <div className="bg-slate-800/70 border border-slate-600 rounded-lg overflow-hidden">
    {admin.image_url ? (
      <img
        src={admin.image_url}
        alt={admin.name}
        className="w-full h-auto object-contain"
      />
    ) : (
      <div className={`w-full h-80 bg-gradient-to-br ${admin.color || 'from-slate-700 to-slate-500'} flex items-center justify-center text-white text-5xl font-bold`}>
        {admin.initials}
      </div>
    )}

    <div className="bg-white px-3 py-2">
      {isEditing ? (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded"
            >
              <FiTrash2 size={12} /> Remove
            </button>
          </div>
          <input
            type="text"
            value={admin.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="w-full text-sm text-gray-800 border border-gray-300 rounded px-2 py-1"
            placeholder="Name"
          />
          <input
            type="text"
            value={admin.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className="w-full text-sm text-gray-700 border border-gray-300 rounded px-2 py-1"
            placeholder="Title"
          />
          <input
            type="text"
            value={admin.term || ''}
            onChange={(e) => onFieldChange('term', e.target.value)}
            className="w-full text-xs text-gray-700 border border-gray-300 rounded px-2 py-1"
            placeholder="Term"
          />
          <input
            type="text"
            value={admin.image_url || ''}
            onChange={(e) => onFieldChange('image_url', e.target.value)}
            className="w-full text-xs text-gray-700 border border-gray-300 rounded px-2 py-1"
            placeholder="Profile photo URL"
          />
          <textarea
            rows={2}
            value={admin.bio || ''}
            onChange={(e) => onFieldChange('bio', e.target.value)}
            className="w-full text-xs text-gray-700 border border-gray-300 rounded px-2 py-1"
            placeholder="Short bio"
          />
        </div>
      ) : (
        <>
          <p className="text-xs font-bold uppercase text-gray-900 leading-tight">{admin.name}</p>
          <p className="text-[11px] text-gray-700">{admin.title}</p>
          {admin.term && <p className="text-[11px] text-gray-700">{admin.term}</p>}
          {admin.bio && <p className="text-[11px] text-gray-600 mt-1">{admin.bio}</p>}
        </>
      )}
    </div>
  </div>
);

export default About;

// ─── Board of Trustees Member Card ───────────────────────────────────────────
const BotMemberCard = ({ member, isEditing, onFieldChange, onRemove }) => (
  <div className="flex flex-col items-center text-center" style={{ width: '10rem' }}>
    {member.image_url ? (
      <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-300">
        <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gray-500 flex items-center justify-center text-white font-bold text-3xl">
        {member.initials}
      </div>
    )}
    {isEditing ? (
      <div className="mt-2 space-y-1 w-full">
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] bg-red-100 text-red-700 hover:bg-red-200 px-1.5 py-0.5 rounded w-full"
        >
          Remove
        </button>
        <input
          value={member.name}
          onChange={(e) => onFieldChange('name', e.target.value)}
          className="w-full text-[11px] text-gray-800 border border-gray-300 rounded px-1 py-0.5 text-center"
          placeholder="Name"
        />
        <input
          value={member.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
          className="w-full text-[11px] text-gray-800 border border-gray-300 rounded px-1 py-0.5 text-center"
          placeholder="Title"
        />
        <input
          value={member.image_url || ''}
          onChange={(e) => onFieldChange('image_url', e.target.value)}
          className="w-full text-[11px] text-gray-800 border border-gray-300 rounded px-1 py-0.5 text-center"
          placeholder="Photo URL"
        />
      </div>
    ) : (
      <div className="mt-3 px-1">
        <p className="text-white text-xs font-semibold leading-snug">{member.name}</p>
        <p className="text-gray-400 text-[11px] leading-snug mt-0.5">{member.title}</p>
      </div>
    )}
  </div>
);

// ─── Certificate Card ─────────────────────────────────────────────────────────
const CertificateCard = ({ cert, isEditing, onFieldChange, onRemove, onCertificateClick }) => (
  <div 
    className="bg-green-50 border border-green-300 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
    onClick={() => !isEditing && cert.image_url && onCertificateClick(cert)}
  >
    {cert.image_url ? (
      <div className="w-full h-96 bg-green-100 flex items-center justify-center overflow-hidden">
        <img src={cert.image_url} alt={cert.caption || 'Certificate'} className="w-full h-full object-contain p-3" />
      </div>
    ) : (
      <div className="w-full h-96 bg-gray-200 flex flex-col items-center justify-center text-gray-600 gap-2 rounded-xl">
        <span className="text-4xl">📜</span>
        {!isEditing && <span className="text-xs">No image</span>}
      </div>
    )}
    {isEditing ? (
      <div className="p-2 space-y-1 bg-white">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded"
          >
            <FiTrash2 size={11} /> Remove
          </button>
        </div>
        <input
          value={cert.image_url || ''}
          onChange={(e) => onFieldChange('image_url', e.target.value)}
          className="w-full text-xs text-gray-800 border border-gray-300 rounded px-2 py-1"
          placeholder="Certificate image URL"
        />
        <input
          value={cert.caption || ''}
          onChange={(e) => onFieldChange('caption', e.target.value)}
          className="w-full text-xs text-gray-800 border border-gray-300 rounded px-2 py-1"
          placeholder="Caption"
        />
      </div>
    ) : cert.caption ? (
      <p className="text-xs text-gray-400 text-center p-2">{cert.caption}</p>
    ) : null}
  </div>
);
