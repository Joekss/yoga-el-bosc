// components/Chat.jsx
// ─────────────────────────────────────────────────────────────────────────────
// PAQUET INDEPENDENT — Sistema de xat professora ↔ alumna
//
// Substitueix la pantalla "Notes de la professora". Inclou:
//   · Vista alumna: xat 1-a-1 amb la professora (només la professora pot iniciar)
//   · Vista professora (CRM): safata d'alumnes + xat + context lateral
//   · Difusió a múltiples alumnes per checkbox
//   · Compositor multi-mèdia: text, àudio, imatge, PDF, postura, sessió, citació, emojis
//   · Reaccions amb emojis a missatges
//   · Confirmacions de lectura asimètriques (la professora veu si l'alumna ha llegit)
//   · Notes privades, missatges programats, recordatoris
//
// Punts d'entrada:
//   <Chat t lang role asanas /> on role = 'student' | 'teacher'
//
// Dades en memòria (no persistents) per facilitar el prototip.
// ─────────────────────────────────────────────────────────────────────────────

const { useState: uSC, useEffect: uEC, useMemo: uMC, useRef: uRC, useCallback: uCC } = React;

// ── i18n curt del paquet ────────────────────────────────────────────────────
const CHAT_T = {
  ca: {
    chatTitle: 'Xat amb Cèlia',
    teacherTitle: 'Mode professora',
    inboxTitle: 'Alumnes',
    searchStudents: 'Cerca alumna…',
    composerPh: 'Escriu un missatge…',
    composerPhTeacher: 'Respon a {name}…',
    composerPhBroadcast: 'Difusió per a {n} alumnes…',
    studentCantInitiate: 'Pots respondre a la Cèlia quan ella et contacti.',
    waitingTeacher: 'Esperant un missatge de la Cèlia',
    today: 'Avui', yesterday: 'Ahir',
    sent: 'Enviat', delivered: 'Lliurat', read: 'Llegit',
    schedule: 'Programar', scheduled: 'Programat', scheduledFor: 'Programat per',
    private: 'Nota privada', privateHint: 'Només tu ho veuràs',
    reminder: 'Recordatori', reminderAt: 'Recordatori per',
    broadcast: 'Difusió', broadcastShort: 'Difusió',
    selectStudents: 'Selecciona alumnes', allStudents: 'Totes',
    selected: 'seleccionades', sendBroadcast: 'Enviar difusió',
    attach: 'Adjuntar',
    text: 'Text', audio: 'Àudio', image: 'Imatge', pdf: 'PDF',
    pose: 'Postura', session: 'Sessió', quote: 'Citació', emoji: 'Emoji',
    react: 'Reaccionar', reply: 'Respondre', edit: 'Editar', cancel: 'Cancel·lar', remove: 'Eliminar', save: 'Guardar',
    context: 'Context', notes: 'Notes', profile: 'Perfil',
    privateNotes: 'Notes privades', addNote: 'Afegir nota…',
    lastPractice: 'Última pràctica', focus: 'Enfocament', injuries: 'Lesions', frequency: 'Freqüència',
    weeklyPlan: 'Pla setmanal', goals: 'Objectius',
    suggestPose: 'Suggerir postura', suggestSession: 'Enviar sessió', sendQuote: 'Enviar citació',
    typing: 'Escrivint…',
    online: 'En línia', offlineSince: 'Vista per últim cop',
    needsReply: 'Pendent', recent: 'Recents', muted: 'Silenciat',
    recordingHold: 'Mantén premut per gravar',
    record: 'Gravant…', release: 'Deixa anar per enviar',
    pickPose: 'Escull una postura', pickSession: 'Escull una sessió',
    quotes: 'Citacions',
    minute: 'min', poses: 'postures',
    practiceFor: 'Practica suggerida per a tu',
    poseSuggestion: 'Postura suggerida',
    quoteFromTeacher: 'Una citació per tu',
    me: 'Tu', her: 'Cèlia',
    when: 'Quan',
    now: 'Ara', in15: 'En 15 min', in1h: 'En 1 hora', tomorrow8: 'Demà 8:00', custom: 'Personalitzat',
    deleteScheduled: 'Cancel·lar enviament',
    saveNote: 'Guardar nota',
    composerHint: 'Pots adjuntar postures, sessions, citacions o àudio',
    nothingYet: 'Encara no hi ha missatges',
    teacherStartedConv: 'La Cèlia ha iniciat aquesta conversa',
    role: 'Rol',
    roleStudent: 'Alumna', roleTeacher: 'Professora',
    asEmoji: 'Reacciona ràpid',
    pinned: 'Fixat',
    inviteText: 'Què t\'agradaria preguntar a la Cèlia avui?',
  },
  es: {
    chatTitle: 'Chat con Cèlia',
    teacherTitle: 'Modo profesora',
    inboxTitle: 'Alumnas',
    searchStudents: 'Buscar alumna…',
    composerPh: 'Escribe un mensaje…',
    composerPhTeacher: 'Responde a {name}…',
    composerPhBroadcast: 'Difusión para {n} alumnas…',
    studentCantInitiate: 'Puedes responder a Cèlia cuando ella te contacte.',
    waitingTeacher: 'Esperando un mensaje de Cèlia',
    today: 'Hoy', yesterday: 'Ayer',
    sent: 'Enviado', delivered: 'Entregado', read: 'Leído',
    schedule: 'Programar', scheduled: 'Programado', scheduledFor: 'Programado para',
    private: 'Nota privada', privateHint: 'Solo tú lo verás',
    reminder: 'Recordatorio', reminderAt: 'Recordatorio para',
    broadcast: 'Difusión', broadcastShort: 'Difusión',
    selectStudents: 'Selecciona alumnas', allStudents: 'Todas',
    selected: 'seleccionadas', sendBroadcast: 'Enviar difusión',
    attach: 'Adjuntar',
    text: 'Texto', audio: 'Audio', image: 'Imagen', pdf: 'PDF',
    pose: 'Postura', session: 'Sesión', quote: 'Cita', emoji: 'Emoji',
    react: 'Reaccionar', reply: 'Responder', edit: 'Editar', cancel: 'Cancelar', remove: 'Eliminar', save: 'Guardar',
    context: 'Contexto', notes: 'Notas', profile: 'Perfil',
    privateNotes: 'Notas privadas', addNote: 'Añadir nota…',
    lastPractice: 'Última práctica', focus: 'Enfoque', injuries: 'Lesiones', frequency: 'Frecuencia',
    weeklyPlan: 'Plan semanal', goals: 'Objetivos',
    suggestPose: 'Sugerir postura', suggestSession: 'Enviar sesión', sendQuote: 'Enviar cita',
    typing: 'Escribiendo…',
    online: 'En línea', offlineSince: 'Vista por última vez',
    needsReply: 'Pendiente', recent: 'Recientes', muted: 'Silenciado',
    recordingHold: 'Mantén pulsado para grabar',
    record: 'Grabando…', release: 'Suelta para enviar',
    pickPose: 'Elige una postura', pickSession: 'Elige una sesión',
    quotes: 'Citas',
    minute: 'min', poses: 'posturas',
    practiceFor: 'Práctica sugerida para ti',
    poseSuggestion: 'Postura sugerida',
    quoteFromTeacher: 'Una cita para ti',
    me: 'Tú', her: 'Cèlia',
    when: 'Cuándo',
    now: 'Ahora', in15: 'En 15 min', in1h: 'En 1 hora', tomorrow8: 'Mañana 8:00', custom: 'Personalizado',
    deleteScheduled: 'Cancelar envío',
    saveNote: 'Guardar nota',
    composerHint: 'Puedes adjuntar posturas, sesiones, citas o audio',
    nothingYet: 'Todavía no hay mensajes',
    teacherStartedConv: 'Cèlia ha iniciado esta conversación',
    role: 'Rol',
    roleStudent: 'Alumna', roleTeacher: 'Profesora',
    asEmoji: 'Reacciona rápido',
    pinned: 'Fijado',
    inviteText: '¿Qué te gustaría preguntar a Cèlia hoy?',
  },
  en: {
    chatTitle: 'Chat with Cèlia',
    teacherTitle: 'Teacher mode',
    inboxTitle: 'Students',
    searchStudents: 'Search student…',
    composerPh: 'Write a message…',
    composerPhTeacher: 'Reply to {name}…',
    composerPhBroadcast: 'Broadcast to {n} students…',
    studentCantInitiate: 'You can reply to Cèlia once she contacts you.',
    waitingTeacher: 'Waiting for a message from Cèlia',
    today: 'Today', yesterday: 'Yesterday',
    sent: 'Sent', delivered: 'Delivered', read: 'Read',
    schedule: 'Schedule', scheduled: 'Scheduled', scheduledFor: 'Scheduled for',
    private: 'Private note', privateHint: 'Only you will see it',
    reminder: 'Reminder', reminderAt: 'Reminder at',
    broadcast: 'Broadcast', broadcastShort: 'Broadcast',
    selectStudents: 'Select students', allStudents: 'All',
    selected: 'selected', sendBroadcast: 'Send broadcast',
    attach: 'Attach',
    text: 'Text', audio: 'Audio', image: 'Image', pdf: 'PDF',
    pose: 'Pose', session: 'Session', quote: 'Quote', emoji: 'Emoji',
    react: 'React', reply: 'Reply', edit: 'Edit', cancel: 'Cancel', remove: 'Remove', save: 'Save',
    context: 'Context', notes: 'Notes', profile: 'Profile',
    privateNotes: 'Private notes', addNote: 'Add a note…',
    lastPractice: 'Last practice', focus: 'Focus', injuries: 'Injuries', frequency: 'Frequency',
    weeklyPlan: 'Weekly plan', goals: 'Goals',
    suggestPose: 'Suggest pose', suggestSession: 'Send session', sendQuote: 'Send quote',
    typing: 'Typing…',
    online: 'Online', offlineSince: 'Last seen',
    needsReply: 'Pending', recent: 'Recent', muted: 'Muted',
    recordingHold: 'Hold to record',
    record: 'Recording…', release: 'Release to send',
    pickPose: 'Pick a pose', pickSession: 'Pick a session',
    quotes: 'Quotes',
    minute: 'min', poses: 'poses',
    practiceFor: 'Practice suggested for you',
    poseSuggestion: 'Suggested pose',
    quoteFromTeacher: 'A quote for you',
    me: 'You', her: 'Cèlia',
    when: 'When',
    now: 'Now', in15: 'In 15 min', in1h: 'In 1 hour', tomorrow8: 'Tomorrow 8:00', custom: 'Custom',
    deleteScheduled: 'Cancel send',
    saveNote: 'Save note',
    composerHint: 'You can attach poses, sessions, quotes or audio',
    nothingYet: 'No messages yet',
    teacherStartedConv: 'Cèlia started this conversation',
    role: 'Role',
    roleStudent: 'Student', roleTeacher: 'Teacher',
    asEmoji: 'Quick react',
    pinned: 'Pinned',
    inviteText: 'What would you like to ask Cèlia today?',
  },
};

// ── Mock alumnes ────────────────────────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: 'nuria', name: 'Núria', initials: 'N', accent: '#B8744A',
    level: 'principiant', frequency: 3, focus: ['Esquena', 'Malucs'],
    injuries: ['Esquena baixa'], goals: ['Relaxació', 'Dormir millor'],
    lastPracticeDays: 1, online: true },
  { id: 'marta', name: 'Marta', initials: 'M', accent: '#5A8C42',
    level: 'intermedi', frequency: 4, focus: ['Core', 'Equilibri'],
    injuries: [], goals: ['Força', 'Concentració'],
    lastPracticeDays: 0, online: false },
  { id: 'joana', name: 'Joana', initials: 'J', accent: '#3F7AAA',
    level: 'avancat', frequency: 5, focus: ['Inversions', 'Espatlles'],
    injuries: ['Canells'], goals: ['Espiritualitat', 'Energia'],
    lastPracticeDays: 2, online: false },
  { id: 'aina', name: 'Aina', initials: 'A', accent: '#D97A2A',
    level: 'principiant', frequency: 2, focus: ['Coll', 'Espatlles'],
    injuries: ['Coll'], goals: ['Alleujar dolor', 'Relaxació'],
    lastPracticeDays: 4, online: false },
  { id: 'laia', name: 'Laia', initials: 'L', accent: '#7A4A8A',
    level: 'intermedi', frequency: 3, focus: ['Glutis', 'Cames'],
    injuries: [], goals: ['Flexibilitat', 'Energia'],
    lastPracticeDays: 1, online: true },
  { id: 'roser', name: 'Roser', initials: 'R', accent: '#3D3D8A',
    level: 'principiant', frequency: 2, focus: ['Esquena'],
    injuries: ['Hèrnia discal'], goals: ['Alleujar dolor'],
    lastPracticeDays: 7, online: false },
];

// ── Citacions ───────────────────────────────────────────────────────────────
const QUOTES_BANK = [
  { ca:'El cos és el temple de l\'esperit. Cuida\'l.', es:'El cuerpo es el templo del espíritu. Cuídalo.', en:'The body is the temple of the spirit. Care for it.', author:'B.K.S. Iyengar' },
  { ca:'Yoga és la quietud de les ones de la ment.', es:'El yoga es la quietud de las olas de la mente.', en:'Yoga is the stilling of the waves of the mind.', author:'Patañjali' },
  { ca:'Inhala el present, exhala el passat.', es:'Inhala el presente, exhala el pasado.', en:'Inhale the present, exhale the past.', author:'—' },
  { ca:'No hi ha pràctica perfecta, només pràctica honesta.', es:'No hay práctica perfecta, solo práctica honesta.', en:'There is no perfect practice, only honest practice.', author:'—' },
  { ca:'On va el respir, va l\'atenció.', es:'Donde va la respiración, va la atención.', en:'Where the breath goes, attention follows.', author:'—' },
];

// ── Conjunt d'emojis ────────────────────────────────────────────────────────
const EMOJI_SET = ['🙏','❀','🌿','🌸','✨','🤍','🙌','🌅','🌙','☁️','🔥','💧','😊','🥲','😮‍💨','💪'];
const QUICK_REACTIONS = ['🙏','❀','✨','🤍','🌿','🔥'];

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const fmtDay = (ts, t) => {
  const d = new Date(ts), today = new Date();
  const diff = Math.floor((today.setHours(0,0,0,0) - new Date(ts).setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return t.today;
  if (diff === 1) return t.yesterday;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
const lastSeenLabel = (days, t) => {
  if (days === 0) return t.today;
  if (days === 1) return `${t.yesterday}`;
  return `${days}d`;
};

// Crea un identificador únic prou robust per a un prototip
let _msgId = 1000;
const newId = () => `m_${++_msgId}_${Math.floor(Math.random()*9999)}`;

// ── Estat inicial: missatges per alumna ─────────────────────────────────────
const seedConversations = (lang) => {
  const now = Date.now();
  const M = (over) => ({
    id: newId(), kind: 'text', from: 'teacher',
    body: '', time: now, status: 'read', reactions: [], ...over,
  });
  return {
    nuria: [
      M({ from:'teacher', kind:'text',
        body: { ca:'Bon dia, Núria. Com et trobes l\'esquena aquesta setmana?', es:'Buenos días, Núria. ¿Cómo va tu espalda esta semana?', en:'Good morning, Núria. How is your back this week?' }[lang],
        time: now - 86400000*2, status: 'read' }),
      M({ from:'student', kind:'text',
        body: { ca:'Una mica millor després de la pràctica de dilluns 🙏', es:'Algo mejor tras la práctica del lunes 🙏', en:'A bit better after Monday\'s practice 🙏' }[lang],
        time: now - 86400000*2 + 1200000, status:'sent' }),
      M({ from:'teacher', kind:'pose', body: { id:'balasana' },
        time: now - 86400000 - 7200000, status:'read' }),
      M({ from:'teacher', kind:'text',
        body: { ca:'Mira si aquesta postura abans de dormir t\'ajuda.', es:'Mira si esta postura antes de dormir te ayuda.', en:'See if this pose before bed helps.' }[lang],
        time: now - 86400000 - 7200000 + 4000, status:'read' }),
      M({ from:'student', kind:'audio', body: { duration: 14, waveform: [0.3,0.5,0.7,0.4,0.6,0.8,0.5,0.3,0.4,0.6,0.7,0.5,0.4,0.3] },
        time: now - 3600000*5, status:'sent' }),
      M({ from:'teacher', kind:'quote', body: QUOTES_BANK[1],
        time: now - 1800000, status:'delivered' }),
    ],
    marta: [
      M({ from:'teacher', kind:'session', body: { duration: 30, poses: 8, focus: { ca:'Core', es:'Core', en:'Core' }[lang] },
        time: now - 86400000*3, status:'read' }),
      M({ from:'student', kind:'text',
        body: { ca:'Quina meravella! Demà la faig.', es:'¡Qué maravilla! Mañana la hago.', en:'Wonderful! I\'ll do it tomorrow.' }[lang],
        time: now - 86400000*3 + 600000, status:'sent' }),
    ],
    joana: [
      M({ from:'teacher', kind:'text',
        body: { ca:'Joana, recorda escalfar canells abans d\'inversions.', es:'Joana, recuerda calentar muñecas antes de invertir.', en:'Joana, remember to warm wrists before inversions.' }[lang],
        time: now - 86400000*5, status:'read' }),
    ],
    aina: [
      M({ from:'teacher', kind:'text',
        body: { ca:'Hola Aina, fa uns dies que no et veig per la pràctica. Tot bé? 🌿', es:'Hola Aina, hace unos días que no te veo practicando. ¿Todo bien? 🌿', en:'Hi Aina, I haven\'t seen you practising for a few days. All well? 🌿' }[lang],
        time: now - 86400000*2, status:'delivered' }),
    ],
    laia: [
      M({ from:'teacher', kind:'image', body: { caption: { ca:'Esquema d\'alineació pel guerrer II', es:'Esquema de alineación para guerrero II', en:'Alignment chart for warrior II' }[lang] },
        time: now - 86400000, status:'read' }),
      M({ from:'student', kind:'text',
        body: { ca:'Gràcies! Ho practico avui mateix ✨', es:'¡Gracias! Lo practico hoy mismo ✨', en:'Thank you! Practising it today ✨' }[lang],
        time: now - 86400000 + 1500000, status:'sent', reactions: [{ emoji:'❀', by:'teacher' }] }),
    ],
    roser: [
      M({ from:'teacher', kind:'text',
        body: { ca:'Roser, comencem suau aquesta setmana. Et passo una pràctica adaptada.', es:'Roser, esta semana suave. Te paso una práctica adaptada.', en:'Roser, gentle week ahead. Sending you an adapted practice.' }[lang],
        time: now - 86400000*7, status:'read' }),
    ],
  };
};

// ── Bombolla d'un missatge ──────────────────────────────────────────────────
const Bubble = ({ msg, mine, t, lang, asanas, onReact, onLongPress }) => {
  const [showActions, setShowActions] = uSC(false);
  const [audioPlaying, setAudioPlaying] = uSC(false);
  const audioElRef = uRC(null);
  const toggleAudio = () => {
    const url = msg.body?.url;
    if (!url) return;
    if (audioPlaying) {
      audioElRef.current?.pause();
      setAudioPlaying(false);
    } else {
      if (!audioElRef.current) {
        audioElRef.current = new Audio(url);
        audioElRef.current.onended = () => { setAudioPlaying(false); audioElRef.current = null; };
      }
      audioElRef.current.play().catch(() => setAudioPlaying(false));
      setAudioPlaying(true);
    }
  };
  const bg = mine
    ? 'var(--accent)'
    : 'color-mix(in srgb, var(--ink) 5%, var(--cream))';
  const color = mine ? 'var(--cream)' : 'var(--ink)';
  const align = mine ? 'flex-end' : 'flex-start';
  const radius = mine ? '20px 20px 6px 20px' : '20px 20px 20px 6px';

  // Render del cos segons el kind
  const renderBody = () => {
    if (msg.kind === 'text') return (
      <div style={{ fontFamily:'var(--serif)', fontSize: 15.5, lineHeight: 1.45, whiteSpace:'pre-wrap' }}>{msg.body}</div>
    );
    if (msg.kind === 'audio') {
      const wf = msg.body.waveform || [];
      const hasUrl = !!msg.body?.url;
      return (
        <div style={{ display:'flex', alignItems:'center', gap: 10, minWidth: 180 }}>
          <button onClick={toggleAudio} disabled={!hasUrl}
            style={{ width: 32, height: 32, borderRadius:'50%', border:'none', background: mine ? 'var(--cream)':'var(--accent)', color: mine ? 'var(--accent)':'var(--cream)', cursor: hasUrl ? 'pointer' : 'default', opacity: hasUrl ? 1 : 0.5, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name={audioPlaying ? 'pause' : 'play'} size={14} color={mine ? 'var(--accent)':'var(--cream)'}/>
          </button>
          <div style={{ display:'flex', alignItems:'center', gap: 2, height: 24 }}>
            {wf.map((v,i)=>(
              <div key={i} style={{ width: 3, height: `${Math.max(v*100, 12)}%`, background: mine ? 'color-mix(in srgb, var(--cream) 70%, transparent)':'var(--accent)', borderRadius: 2 }}/>
            ))}
          </div>
          <span style={{ fontFamily:'var(--sans)', fontSize: 11, opacity: 0.85 }}>{msg.body.duration}s</span>
        </div>
      );
    }
    if (msg.kind === 'image') return (
      <div>
        <div style={{ width: 200, height: 130, borderRadius: 14, background: 'linear-gradient(135deg, var(--sand), var(--paper-2))', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
          <svg viewBox="0 0 100 60" style={{ width:'85%', opacity: 0.6 }}>
            <path d="M5 50 L25 30 L40 42 L60 18 L82 38 L95 28 L95 55 L5 55 Z" fill="var(--leaf)" opacity="0.5"/>
            <circle cx="78" cy="14" r="6" fill="var(--accent)" opacity="0.7"/>
          </svg>
        </div>
        {msg.body?.caption && (
          <div style={{ marginTop: 6, fontFamily:'var(--serif)', fontSize: 14 }}>{msg.body.caption}</div>
        )}
      </div>
    );
    if (msg.kind === 'pdf') return (
      <div style={{ display:'flex', alignItems:'center', gap: 10, minWidth: 200, padding: '4px 0' }}>
        <div style={{ width: 40, height: 48, borderRadius: 6, background: mine ? 'var(--cream)':'var(--accent)', color: mine ? 'var(--accent)':'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--sans)', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>PDF</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500 }}>{msg.body?.name || 'pranayama-guide.pdf'}</div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, opacity: 0.7 }}>{msg.body?.size || '320 KB'}</div>
        </div>
        <Icon name="download" size={16} color={mine ? 'var(--cream)':'var(--ink-soft)'}/>
      </div>
    );
    if (msg.kind === 'pose') {
      const a = (asanas || []).find(x => x.id === msg.body?.id) || (asanas || [])[0];
      if (!a) return null;
      return (
        <div style={{ minWidth: 220 }}>
          <div style={{ fontFamily:'var(--sans)', fontSize: 10, letterSpacing:'0.18em', textTransform:'uppercase', opacity: 0.75, marginBottom: 6 }}>
            {t.poseSuggestion}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 10, padding: 10, background: mine ? 'color-mix(in srgb, var(--cream) 18%, transparent)':'var(--paper)', borderRadius: 12 }}>
            <div style={{ width: 64, height: 64, background: mine ? 'var(--cream)':'var(--paper-2)', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {window.PoseSVG ? <PoseSVG id={a.id} size={50} color={mine ? 'var(--accent)':'var(--ink-soft)'} style="line"/> : <Icon name="flower" size={26} color={mine ? 'var(--accent)':'var(--ink-soft)'}/>}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--serif)', fontSize: 16, fontStyle:'italic' }}>{a.name?.[lang] || a.name?.ca || a.id}</div>
              <div style={{ fontFamily:'var(--sans)', fontSize: 11, opacity: 0.75, marginTop: 2 }}>{a.sanskrit} · {Math.round(a.duration)}s</div>
            </div>
          </div>
        </div>
      );
    }
    if (msg.kind === 'session') return (
      <div style={{ minWidth: 240 }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 10, letterSpacing:'0.18em', textTransform:'uppercase', opacity: 0.75, marginBottom: 6 }}>
          {t.practiceFor}
        </div>
        <div style={{ padding: 12, background: mine ? 'color-mix(in srgb, var(--cream) 18%, transparent)':'var(--paper)', borderRadius: 12 }}>
          <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 18 }}>{msg.body?.focus || 'Hatha'}</div>
          <div style={{ display:'flex', gap: 14, marginTop: 8, fontFamily:'var(--sans)', fontSize: 12 }}>
            <span><Icon name="timer" size={12} color="currentColor"/> {msg.body?.duration} {t.minute}</span>
            <span><Icon name="flower" size={12} color="currentColor"/> {msg.body?.poses} {t.poses}</span>
          </div>
          <button style={{ marginTop: 10, padding: '8px 14px', borderRadius: 999, border:'none', background: mine ? 'var(--cream)':'var(--accent)', color: mine ? 'var(--accent)':'var(--cream)', fontFamily:'var(--sans)', fontSize: 12, cursor:'pointer', fontWeight: 500 }}>
            <Icon name="play" size={11} color={mine ? 'var(--accent)':'var(--cream)'}/> {{ ca:'Començar', es:'Empezar', en:'Start' }[lang]}
          </button>
        </div>
      </div>
    );
    if (msg.kind === 'quote') return (
      <div style={{ minWidth: 220, maxWidth: 260 }}>
        <Icon name="quote" size={16} color={mine ? 'var(--cream)':'var(--accent)'}/>
        <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 17, lineHeight: 1.4, marginTop: 4 }}>
          "{msg.body?.[lang] || msg.body?.ca}"
        </div>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, opacity: 0.75, marginTop: 6, letterSpacing:'0.05em' }}>— {msg.body?.author}</div>
      </div>
    );
    return null;
  };

  // Indicador d'estat (asimètric: només la professora veu lectures de l'alumna)
  const statusIcon = (() => {
    if (!mine) return null;
    if (msg.scheduled) return <Icon name="clock" size={11} color="currentColor"/>;
    if (msg.status === 'read') return <Icon name="check2" size={12} color="#9AD9C5"/>;
    if (msg.status === 'delivered') return <Icon name="check2" size={12} color="currentColor"/>;
    return <Icon name="check" size={12} color="currentColor"/>;
  })();

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems: align, marginBottom: 8, animation:'ybFadeUp .25s ease' }}
         onMouseLeave={()=>setShowActions(false)}>
      <div style={{ position:'relative', maxWidth: '78%' }}>
        <div onClick={() => setShowActions(s=>!s)}
             onContextMenu={(e)=>{ e.preventDefault(); onLongPress?.(msg); }}
             style={{
               background: bg, color, padding: msg.kind === 'text' ? '10px 14px' : '10px 12px',
               borderRadius: radius, boxShadow: 'var(--shadow-1)', cursor:'pointer',
               border: msg.private ? '1.5px dashed color-mix(in srgb, var(--accent) 60%, transparent)' : 'none',
             }}>
          {msg.private && (
            <div style={{ display:'flex', alignItems:'center', gap: 4, marginBottom: 4, fontFamily:'var(--sans)', fontSize: 9, letterSpacing:'0.18em', textTransform:'uppercase', opacity: 0.85 }}>
              <Icon name="pin" size={10} color="currentColor"/> {t.private}
            </div>
          )}
          {msg.scheduled && (
            <div style={{ display:'flex', alignItems:'center', gap: 4, marginBottom: 4, fontFamily:'var(--sans)', fontSize: 9, letterSpacing:'0.18em', textTransform:'uppercase', opacity: 0.85 }}>
              <Icon name="clock" size={10} color="currentColor"/> {t.scheduledFor} {fmtTime(msg.scheduled)}
            </div>
          )}
          {msg.broadcast && (
            <div style={{ display:'flex', alignItems:'center', gap: 4, marginBottom: 4, fontFamily:'var(--sans)', fontSize: 9, letterSpacing:'0.18em', textTransform:'uppercase', opacity: 0.85 }}>
              <Icon name="broadcast" size={10} color="currentColor"/> {t.broadcastShort} · {msg.broadcast}
            </div>
          )}
          {renderBody()}
        </div>

        {/* Reaccions ja aplicades */}
        {msg.reactions?.length > 0 && (
          <div style={{ position:'absolute', bottom: -10, [mine ? 'left':'right']: 8,
                        background:'var(--cream)', borderRadius: 999, padding: '2px 8px',
                        boxShadow:'var(--shadow-1)', display:'flex', gap: 4, fontSize: 12,
                        border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)' }}>
            {msg.reactions.map((r,i)=>(<span key={i}>{r.emoji}</span>))}
          </div>
        )}

        {/* Mini barra d'accions ràpides */}
        {showActions && (
          <div style={{
            position:'absolute', top: -38, [mine ? 'right':'left']: 0,
            background:'var(--cream)', borderRadius: 999, padding: '4px 8px',
            boxShadow:'var(--shadow-2)', display:'flex', gap: 4, zIndex: 5,
            border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)',
          }}>
            {QUICK_REACTIONS.map(e => (
              <button key={e} onClick={(ev) => { ev.stopPropagation(); onReact?.(msg, e); setShowActions(false); }}
                      style={{ background:'transparent', border:'none', cursor:'pointer', fontSize: 18, padding: '2px 4px' }}>
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap: 4, marginTop: 4, paddingInline: 4,
                    fontFamily:'var(--sans)', fontSize: 10, color:'var(--ink-soft)' }}>
        <span>{fmtTime(msg.time)}</span>
        {statusIcon}
      </div>
    </div>
  );
};

// ── Sheet generic (slide-up) ────────────────────────────────────────────────
const Sheet = ({ open, onClose, title, children, height = 'auto' }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'absolute', inset: 0, background:'rgba(20,18,12,0.35)', zIndex: 50, animation:'ybFadeUp .2s ease' }}>
      <div onClick={e=>e.stopPropagation()}
           style={{ position:'absolute', left: 0, right: 0, bottom: 0, background:'var(--paper)',
                    borderRadius:'24px 24px 0 0', padding: '12px 0 24px', maxHeight: '78%',
                    display:'flex', flexDirection:'column', height,
                    boxShadow:'0 -10px 40px rgba(0,0,0,0.18)', animation:'ybFadeUp .3s ease' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background:'color-mix(in srgb, var(--ink) 18%, transparent)', margin:'0 auto 10px' }}/>
        {title && (
          <div style={{ padding:'4px 22px 12px', fontFamily:'var(--sans)', fontSize: 13, letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--accent)' }}>
            {title}
          </div>
        )}
        <div className="yb-scroll" style={{ flex: 1, overflowY:'auto', padding:'0 22px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ── Compositor ──────────────────────────────────────────────────────────────
const Composer = ({ t, lang, asanas, role, broadcastCount, recipientName, onSend, isStudent }) => {
  const [text, setText] = uSC('');
  const [sheet, setSheet] = uSC(null); // 'attach'|'pose'|'session'|'quote'|'emoji'|'schedule'
  const [recording, setRecording] = uSC(false);
  const [recT, setRecT] = uSC(0);
  const [privateMode, setPrivateMode] = uSC(false);
  const [scheduled, setScheduled] = uSC(null); // timestamp or null
  const recTimer = uRC(null);
  const recTRef = uRC(0);
  const mediaRecRef = uRC(null);
  const inputRef = uRC(null);

  uEC(() => {
    if (!recording) {
      if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
    }
    return () => { if (recTimer.current) clearInterval(recTimer.current); };
  }, [recording]);

  const ph = broadcastCount > 0
    ? t.composerPhBroadcast.replace('{n}', broadcastCount)
    : isStudent ? t.composerPh : t.composerPhTeacher.replace('{name}', recipientName || '');

  const sendMsg = (kind, body) => {
    onSend?.({ kind, body, private: privateMode, scheduled });
    setText(''); setPrivateMode(false); setScheduled(null);
  };

  const handleTextSend = () => {
    if (!text.trim()) return;
    sendMsg('text', text.trim());
  };

  const handleEmoji = (e) => {
    setText(s => s + e);
    inputRef.current?.focus();
  };

  const startRecording = () => {
    if (mediaRecRef.current) return;
    // getUserMedia ha d'estar en el handler directe (iOS exigeix gesture directe)
    navigator.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
      // Detecta el millor MIME: iOS només suporta audio/mp4
      const mimeType = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(
        m => { try { return MediaRecorder.isTypeSupported(m); } catch(e) { return false; } }
      ) || '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.start();
      mediaRecRef.current = { recorder, stream, chunks, mimeType };
      recTRef.current = 0;
      setRecT(0);
      recTimer.current = setInterval(() => { recTRef.current++; setRecT(recTRef.current); }, 1000);
      setRecording(true);
    }).catch(() => {
      mediaRecRef.current = null;
      alert({ ca:'Cal permís de micròfon. Ves a Ajustaments > Safari > Micròfon i activa\'l.', es:'Necesitas permiso de micrófono. Ve a Ajustes > Safari > Micrófono y actívalo.', en:'Microphone permission needed. Go to Settings > Safari > Microphone.' }[lang] || 'Microphone permission needed.');
    });
  };

  const handleRecordingEnd = () => {
    clearInterval(recTimer.current);
    recTimer.current = null;
    setRecording(false);
    const duration = recTRef.current;
    const wf = Array.from({length: Math.min(20, Math.max(4, Math.max(duration, 1)*2))}, () => 0.2 + Math.random()*0.7);
    const ctx = mediaRecRef.current;
    mediaRecRef.current = null;
    if (!ctx) return;
    if (ctx.recorder && ctx.recorder.state !== 'inactive') {
      ctx.recorder.onstop = () => {
        const blobType = ctx.mimeType || ctx.recorder.mimeType || 'audio/mp4';
        const blob = new Blob(ctx.chunks, { type: blobType });
        const url = URL.createObjectURL(blob);
        ctx.stream.getTracks().forEach(t => t.stop());
        sendMsg('audio', { duration: Math.max(duration, 1), waveform: wf, url });
      };
      ctx.recorder.stop();
    } else {
      ctx.stream?.getTracks().forEach(t => t.stop());
    }
  };

  const ATTACH_OPTS = [
    { id:'image', label: t.image, icon:'image' },
    { id:'pdf', label: t.pdf, icon:'pdf' },
    { id:'pose', label: t.pose, icon:'flower' },
    { id:'session', label: t.session, icon:'play' },
    { id:'quote', label: t.quote, icon:'quote' },
  ];

  return (
    <>
      {/* Barra superior d'opcions del professor (programar / privat / difusió badge) */}
      {!isStudent && (privateMode || scheduled) && (
        <div style={{ padding:'6px 16px', background:'color-mix(in srgb, var(--accent) 12%, var(--paper))',
                      display:'flex', gap: 8, alignItems:'center', borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
          {privateMode && (
            <span className="yb-chip" style={{ background:'var(--accent)', color:'var(--cream)', padding:'4px 10px', fontSize: 11 }}>
              <Icon name="pin" size={11} color="var(--cream)"/> {t.private}
              <button onClick={()=>setPrivateMode(false)} style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', marginLeft: 4, padding: 0 }}>
                <Icon name="close" size={11} color="var(--cream)"/>
              </button>
            </span>
          )}
          {scheduled && (
            <span className="yb-chip" style={{ background:'var(--leaf)', color:'var(--cream)', padding:'4px 10px', fontSize: 11 }}>
              <Icon name="clock" size={11} color="var(--cream)"/> {t.scheduledFor} {fmtTime(scheduled)}
              <button onClick={()=>setScheduled(null)} style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', marginLeft: 4, padding: 0 }}>
                <Icon name="close" size={11} color="var(--cream)"/>
              </button>
            </span>
          )}
        </div>
      )}

      <div style={{
        padding:'10px 12px calc(env(safe-area-inset-bottom, 12px) + 10px)',
        background:'color-mix(in srgb, var(--paper) 92%, transparent)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
      }}>
        {recording ? (
          <div style={{ display:'flex', alignItems:'center', gap: 12, padding:'10px 14px', background:'color-mix(in srgb, var(--accent) 10%, var(--cream))', borderRadius: 999 }}>
            <span style={{ width: 10, height: 10, borderRadius:'50%', background:'var(--accent)', animation:'ybBreathe 1.2s ease infinite' }}/>
            <div style={{ flex:1, fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink)' }}>
              {t.record} <span style={{ opacity:0.6, marginLeft: 8 }}>{recT}s</span>
            </div>
            <button onClick={()=>setRecording(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--ink-soft)', padding: 4 }}>
              <Icon name="close" size={16}/>
            </button>
            <button onClick={handleRecordingEnd} style={{ width: 36, height: 36, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer', color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="send" size={16} color="var(--cream)"/>
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'flex-end', gap: 8 }}>
            <button onClick={()=>setSheet('attach')} aria-label={t.attach}
                    style={{ width: 38, height: 38, borderRadius:'50%', background:'var(--cream)', border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)', cursor:'pointer', flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="plus" size={18} color="var(--ink-soft)"/>
            </button>

            <div style={{ flex: 1, display:'flex', alignItems:'flex-end', background:'var(--cream)', borderRadius: 22,
                          border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)', padding:'6px 8px 6px 14px' }}>
              <textarea ref={inputRef} value={text} rows={1}
                onChange={e => setText(e.target.value)}
                onInput={(e)=>{ e.target.style.height='auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100)+'px'; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSend(); } }}
                placeholder={ph}
                style={{ flex:1, border:'none', outline:'none', resize:'none', background:'transparent',
                         fontFamily:'var(--serif)', fontSize: 15, lineHeight: 1.4, color:'var(--ink)', minHeight: 24, maxHeight: 100 }}/>
              <button onClick={()=>setSheet('emoji')} style={{ background:'transparent', border:'none', cursor:'pointer', padding: 4, color:'var(--ink-soft)' }} aria-label={t.emoji}>
                <Icon name="smile" size={20} color="var(--ink-soft)"/>
              </button>
            </div>

            {text.trim() ? (
              <button onClick={handleTextSend} aria-label={t.sent}
                      style={{ width: 42, height: 42, borderRadius:'50%', background:'var(--accent)', border:'none', cursor:'pointer', flexShrink: 0,
                               display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--shadow-warm)' }}>
                <Icon name="send" size={18} color="var(--cream)"/>
              </button>
            ) : (
              <button
                onClick={startRecording}
                aria-label={t.audio}
                style={{ width: 42, height: 42, borderRadius:'50%', background:'var(--ink)', border:'none', cursor:'pointer', flexShrink: 0,
                         display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="mic" size={18} color="var(--cream)"/>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sheet d'adjuncions */}
      <Sheet open={sheet === 'attach'} onClose={()=>setSheet(null)} title={t.attach}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10, paddingBottom: 16 }}>
          {ATTACH_OPTS.map(o => (
            <button key={o.id} onClick={() => {
              if (o.id === 'image') { sendMsg('image', { caption:'' }); setSheet(null); }
              else if (o.id === 'pdf') { sendMsg('pdf', { name:'guia-pranayama.pdf', size:'320 KB' }); setSheet(null); }
              else if (o.id === 'pose') setSheet('pose');
              else if (o.id === 'session') setSheet('session');
              else if (o.id === 'quote') setSheet('quote');
            }}
            style={{ background:'var(--cream)', border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
                     borderRadius: 16, padding: 16, display:'flex', flexDirection:'column', alignItems:'center',
                     gap: 8, cursor:'pointer', color:'var(--ink)' }}>
              <div style={{ width: 44, height: 44, borderRadius:'50%', background:'color-mix(in srgb, var(--accent) 12%, transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={o.icon} size={20} color="var(--accent)"/>
              </div>
              <div style={{ fontFamily:'var(--sans)', fontSize: 12 }}>{o.label}</div>
            </button>
          ))}
        </div>

        {/* Opcions exclusives de la professora */}
        {!isStudent && (
          <>
            <div className="yb-divider-leaf" style={{ margin:'6px 0 12px' }}>{{ ca:'Opcions', es:'Opciones', en:'Options' }[lang]}</div>
            <div style={{ display:'flex', flexDirection:'column', gap: 8, paddingBottom: 24 }}>
              <button onClick={() => { setPrivateMode(p=>!p); setSheet(null); }}
                style={{ display:'flex', alignItems:'center', gap: 12, padding:'12px 14px', background: privateMode ? 'color-mix(in srgb, var(--accent) 16%, var(--cream))':'var(--cream)',
                         border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', borderRadius: 14, cursor:'pointer', color:'var(--ink)' }}>
                <Icon name="pin" size={18} color="var(--accent)"/>
                <div style={{ textAlign:'left', flex: 1 }}>
                  <div style={{ fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500 }}>{t.private}</div>
                  <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{t.privateHint}</div>
                </div>
                {privateMode && <Icon name="check" size={16} color="var(--accent)"/>}
              </button>
              <button onClick={() => setSheet('schedule')}
                style={{ display:'flex', alignItems:'center', gap: 12, padding:'12px 14px', background:'var(--cream)',
                         border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', borderRadius: 14, cursor:'pointer', color:'var(--ink)' }}>
                <Icon name="clock" size={18} color="var(--leaf-deep)"/>
                <div style={{ textAlign:'left', flex: 1 }}>
                  <div style={{ fontFamily:'var(--sans)', fontSize: 13, fontWeight: 500 }}>{t.schedule}</div>
                  <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>{scheduled ? fmtTime(scheduled) : '—'}</div>
                </div>
              </button>
            </div>
          </>
        )}
      </Sheet>

      {/* Sheet selecció de postura */}
      <Sheet open={sheet === 'pose'} onClose={()=>setSheet(null)} title={t.pickPose} height="68%">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10, paddingBottom: 16 }}>
          {(asanas || []).slice(0, 16).map(a => (
            <button key={a.id} onClick={() => { sendMsg('pose', { id: a.id }); setSheet(null); }}
              style={{ background:'var(--cream)', borderRadius: 14, padding: 12,
                       border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', cursor:'pointer', color:'var(--ink)' }}>
              <div style={{ height: 70, background:'var(--paper-2)', borderRadius: 10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 8 }}>
                {window.PoseSVG ? <PoseSVG id={a.id} size={56} color="var(--ink-soft)" style="line"/> : <Icon name="flower" size={28} color="var(--ink-soft)"/>}
              </div>
              <div style={{ fontFamily:'var(--serif)', fontSize: 13, textAlign:'left', lineHeight: 1.2 }}>{a.name?.[lang] || a.name?.ca}</div>
              <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 10, color:'var(--ink-soft)', textAlign:'left' }}>{a.sanskrit}</div>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Sheet selecció de sessió */}
      <Sheet open={sheet === 'session'} onClose={()=>setSheet(null)} title={t.pickSession}>
        <div style={{ display:'flex', flexDirection:'column', gap: 10, paddingBottom: 24 }}>
          {[
            { d:20, p:6, f:{ca:'Despertar suau',es:'Despertar suave',en:'Gentle wake-up'}[lang] },
            { d:30, p:8, f:{ca:'Mobilitat de columna',es:'Movilidad columna',en:'Spine mobility'}[lang] },
            { d:45, p:12, f:{ca:'Força i flexibilitat',es:'Fuerza y flexibilidad',en:'Strength & flexibility'}[lang] },
            { d:15, p:5, f:{ca:'Restaurativa per dormir',es:'Restaurativa para dormir',en:'Restorative for sleep'}[lang] },
          ].map((s, i) => (
            <button key={i} onClick={()=>{ sendMsg('session', { duration: s.d, poses: s.p, focus: s.f }); setSheet(null); }}
              style={{ background:'var(--cream)', borderRadius: 14, padding: 14,
                       border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', cursor:'pointer',
                       display:'flex', alignItems:'center', gap: 12, color:'var(--ink)', textAlign:'left' }}>
              <div style={{ width: 44, height: 44, borderRadius:'50%', background:'color-mix(in srgb, var(--leaf) 18%, transparent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="play" size={16} color="var(--leaf-deep)"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 17 }}>{s.f}</div>
                <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)' }}>{s.d} {t.minute} · {s.p} {t.poses}</div>
              </div>
              <Icon name="next" size={16} color="var(--ink-soft)"/>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Sheet citacions */}
      <Sheet open={sheet === 'quote'} onClose={()=>setSheet(null)} title={t.quotes}>
        <div style={{ display:'flex', flexDirection:'column', gap: 10, paddingBottom: 24 }}>
          {QUOTES_BANK.map((q, i) => (
            <button key={i} onClick={()=>{ sendMsg('quote', q); setSheet(null); }}
              style={{ background:'var(--cream)', borderRadius: 14, padding: 14, textAlign:'left',
                       border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', cursor:'pointer', color:'var(--ink)' }}>
              <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 16, lineHeight: 1.4 }}>"{q[lang] || q.ca}"</div>
              <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', marginTop: 6 }}>— {q.author}</div>
            </button>
          ))}
        </div>
      </Sheet>

      {/* Sheet emoji */}
      <Sheet open={sheet === 'emoji'} onClose={()=>setSheet(null)} title={t.emoji}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(8, 1fr)', gap: 6, paddingBottom: 24 }}>
          {EMOJI_SET.map(e => (
            <button key={e} onClick={()=>{ handleEmoji(e); }}
              style={{ background:'var(--cream)', border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
                       borderRadius: 12, padding: 10, cursor:'pointer', fontSize: 22 }}>{e}</button>
          ))}
        </div>
      </Sheet>

      {/* Sheet programar */}
      <Sheet open={sheet === 'schedule'} onClose={()=>setSheet(null)} title={t.schedule}>
        <div style={{ display:'flex', flexDirection:'column', gap: 8, paddingBottom: 24 }}>
          {[
            { label: t.in15, ms: 15*60*1000 },
            { label: t.in1h, ms: 60*60*1000 },
            { label: t.tomorrow8, ms: (() => {
              const d = new Date(); d.setDate(d.getDate()+1); d.setHours(8,0,0,0);
              return d.getTime() - Date.now();
            })() },
          ].map((opt,i) => (
            <button key={i} onClick={()=>{ setScheduled(Date.now()+opt.ms); setSheet(null); }}
              style={{ display:'flex', alignItems:'center', gap: 12, padding:'12px 14px', background:'var(--cream)',
                       border:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)', borderRadius: 14, cursor:'pointer', color:'var(--ink)' }}>
              <Icon name="clock" size={16} color="var(--leaf-deep)"/>
              <div style={{ flex: 1, textAlign:'left', fontFamily:'var(--sans)', fontSize: 14 }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
};

// ── Vista d'una conversa (alumna o professora individual) ───────────────────
const ConversationView = ({ t, lang, asanas, role, student, messages, onSend, onReact, onBack, onOpenContext }) => {
  const scrollRef = uRC(null);
  uEC(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const isStudent = role === 'student';
  const visibleMsgs = isStudent
    ? messages.filter(m => !m.private) // Notes privades només les veu la professora
    : messages;

  // Agrupació per dia
  const groups = uMC(() => {
    const out = []; let last = '';
    for (const m of visibleMsgs) {
      const dayKey = new Date(m.time).toDateString();
      if (dayKey !== last) {
        out.push({ kind:'day', label: fmtDay(m.time, t), key: dayKey });
        last = dayKey;
      }
      out.push({ kind:'msg', m });
    }
    return out;
  }, [visibleMsgs, lang]);

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--paper)' }}>
      {/* Capçalera */}
      <div style={{
        padding:'50px 12px 12px', display:'flex', alignItems:'center', gap: 10,
        background:'color-mix(in srgb, var(--paper) 92%, transparent)',
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
      }}>
        {!isStudent && onBack && (
          <button onClick={onBack} style={{ background:'transparent', border:'none', cursor:'pointer', padding: 6 }}>
            <Icon name="back" size={20} color="var(--ink)"/>
          </button>
        )}
        <div style={{ width: 40, height: 40, borderRadius:'50%',
                      background: student.accent || 'var(--accent)', color:'var(--cream)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--serif)', fontSize: 18, position:'relative' }}>
          {student.initials}
          {student.online && (
            <span style={{ position:'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius:'50%',
                           background:'#5BC788', border:'2px solid var(--paper)' }}/>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily:'var(--serif)', fontSize: 17, fontStyle:'italic', color:'var(--ink)' }}>{student.name}</div>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, color: student.online ? 'var(--leaf-deep)':'var(--ink-soft)' }}>
            {student.online ? t.online : `${t.offlineSince} ${lastSeenLabel(student.lastPracticeDays, t)}`}
          </div>
        </div>
        {!isStudent && (
          <button onClick={onOpenContext} style={{ background:'var(--cream)', border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)',
                  borderRadius: '50%', width: 36, height: 36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="user" size={16} color="var(--ink-soft)"/>
          </button>
        )}
      </div>

      {/* Cos */}
      <div ref={scrollRef} className="yb-scroll" style={{ flex: 1, overflowY:'auto', padding:'14px 14px 6px' }}>
        {groups.length === 0 && isStudent && (
          <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius:'50%', background:'color-mix(in srgb, var(--accent) 14%, transparent)',
                          display:'flex', alignItems:'center', justifyContent:'center', marginBottom: 14 }}>
              <Icon name="leaf" size={24} color="var(--accent)"/>
            </div>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 19, color:'var(--ink)' }}>{t.waitingTeacher}</div>
            <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)', marginTop: 8 }}>{t.studentCantInitiate}</div>
          </div>
        )}
        {groups.map((g, i) => g.kind === 'day' ? (
          <div key={'d'+i} style={{ textAlign:'center', margin:'12px 0 10px' }}>
            <span style={{ fontFamily:'var(--sans)', fontSize: 10, letterSpacing:'0.18em', textTransform:'uppercase',
                           color:'var(--ink-soft)', background:'color-mix(in srgb, var(--ink) 5%, transparent)',
                           padding:'4px 10px', borderRadius: 999 }}>
              {g.label}
            </span>
          </div>
        ) : (
          <Bubble key={g.m.id}
                  msg={g.m}
                  mine={(isStudent && g.m.from === 'student') || (!isStudent && g.m.from === 'teacher')}
                  t={t} lang={lang} asanas={asanas}
                  onReact={onReact}/>
        ))}
        <div style={{ height: 8 }}/>
      </div>

      {/* Compositor */}
      {(isStudent && messages.length === 0) ? (
        <div style={{ padding:'14px 18px calc(env(safe-area-inset-bottom, 12px) + 14px)',
                       background:'color-mix(in srgb, var(--paper) 92%, transparent)',
                       borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
                       textAlign:'center' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)' }}>
            {t.studentCantInitiate}
          </div>
        </div>
      ) : (
        <Composer t={t} lang={lang} asanas={asanas} role={role}
                  recipientName={student.name} isStudent={isStudent}
                  onSend={onSend}/>
      )}
    </div>
  );
};

// ── Drawer de context (només mode professora) ─────────────────────────────
const ContextDrawer = ({ open, onClose, t, lang, student, privateNotes, onAddNote, onRemoveNote }) => {
  const [draft, setDraft] = uSC('');
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'absolute', inset: 0, background:'rgba(20,18,12,0.35)', zIndex: 60, animation:'ybFadeUp .2s ease' }}>
      <div onClick={e=>e.stopPropagation()}
           style={{ position:'absolute', top: 0, bottom: 0, right: 0, width: '85%', maxWidth: 360,
                    background:'var(--paper)', display:'flex', flexDirection:'column',
                    boxShadow:'-10px 0 40px rgba(0,0,0,0.18)', animation:'ybFadeUp .3s ease' }}>
        <div style={{ padding:'50px 18px 14px', display:'flex', alignItems:'center', gap: 12,
                      borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
          <div style={{ width: 50, height: 50, borderRadius:'50%', background: student.accent,
                        color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center',
                        fontFamily:'var(--serif)', fontSize: 22 }}>
            {student.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 22, color:'var(--ink)' }}>{student.name}</div>
            <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              {{ ca:'Nivell', es:'Nivel', en:'Level' }[lang]} · {student.level}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', padding: 6 }}>
            <Icon name="close" size={20} color="var(--ink-soft)"/>
          </button>
        </div>

        <div className="yb-scroll" style={{ flex: 1, overflowY:'auto', padding:'14px 18px 30px' }}>
          {/* Resum */}
          <div className="yb-card" style={{ padding: 14, marginBottom: 14 }}>
            <div className="yb-divider-leaf" style={{ marginBottom: 10 }}>{t.profile}</div>
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', columnGap: 12, rowGap: 8, fontFamily:'var(--sans)', fontSize: 12 }}>
              <div style={{ color:'var(--ink-soft)' }}>{t.frequency}</div>
              <div>{student.frequency}× {{ ca:'/setmana', es:'/semana', en:'/week' }[lang]}</div>
              <div style={{ color:'var(--ink-soft)' }}>{t.lastPractice}</div>
              <div>{lastSeenLabel(student.lastPracticeDays, t)}</div>
              <div style={{ color:'var(--ink-soft)' }}>{t.focus}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap: 4 }}>
                {student.focus.map(f => (<span key={f} className="yb-chip" style={{ padding:'3px 9px', fontSize: 11 }}>{f}</span>))}
              </div>
              {student.injuries.length > 0 && (
                <>
                  <div style={{ color:'var(--ink-soft)' }}>{t.injuries}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap: 4 }}>
                    {student.injuries.map(f => (
                      <span key={f} className="yb-chip" style={{ padding:'3px 9px', fontSize: 11, background:'color-mix(in srgb, var(--accent) 16%, transparent)', color:'var(--accent-deep)' }}>{f}</span>
                    ))}
                  </div>
                </>
              )}
              <div style={{ color:'var(--ink-soft)' }}>{t.goals}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap: 4 }}>
                {student.goals.map(f => (<span key={f} className="yb-chip" style={{ padding:'3px 9px', fontSize: 11 }}>{f}</span>))}
              </div>
            </div>
          </div>

          {/* Notes privades */}
          <div className="yb-card" style={{ padding: 14 }}>
            <div className="yb-divider-leaf" style={{ marginBottom: 10 }}>{t.privateNotes}</div>
            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              {(privateNotes || []).length === 0 && (
                <div style={{ fontFamily:'var(--sans)', fontSize: 12, color:'var(--ink-soft)', textAlign:'center', padding:'10px 0' }}>—</div>
              )}
              {(privateNotes || []).map((n, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap: 8, padding: 10,
                                       background:'color-mix(in srgb, var(--accent) 8%, var(--cream))',
                                       borderRadius: 12, border:'1px dashed color-mix(in srgb, var(--accent) 40%, transparent)' }}>
                  <Icon name="pin" size={14} color="var(--accent)"/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily:'var(--serif)', fontSize: 14, lineHeight: 1.45 }}>{n.body}</div>
                    <div style={{ fontFamily:'var(--sans)', fontSize: 10, color:'var(--ink-soft)', marginTop: 4 }}>
                      {fmtDay(n.time, t)} · {fmtTime(n.time)}
                    </div>
                  </div>
                  <button onClick={()=>onRemoveNote?.(i)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--ink-soft)', padding: 2 }}>
                    <Icon name="close" size={12} color="currentColor"/>
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap: 6, marginTop: 12 }}>
              <input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={t.addNote}
                onKeyDown={e=>{ if (e.key === 'Enter' && draft.trim()) { onAddNote?.(draft.trim()); setDraft(''); } }}
                style={{ flex:1, padding:'10px 12px', borderRadius: 999, border:'1px solid color-mix(in srgb, var(--ink) 12%, transparent)',
                         fontFamily:'var(--serif)', fontSize: 14, background:'var(--cream)', outline:'none', color:'var(--ink)' }}/>
              <button onClick={()=>{ if (draft.trim()) { onAddNote?.(draft.trim()); setDraft(''); } }}
                style={{ width: 38, height: 38, borderRadius:'50%', background:'var(--accent)', border:'none', color:'var(--cream)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="check" size={14} color="var(--cream)"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Safata d'alumnes (mode professora) ─────────────────────────────────────
const StudentInbox = ({ t, lang, students, conversations, onOpen, onBroadcast }) => {
  const [q, setQ] = uSC('');
  const [filter, setFilter] = uSC('all');

  const lastMsg = (sid) => {
    const msgs = (conversations[sid] || []).filter(m => !m.private);
    return msgs[msgs.length - 1];
  };
  const unreadFromStudent = (sid) => {
    return (conversations[sid] || []).some(m => m.from === 'student' && m.status !== 'read');
  };

  const filtered = students
    .filter(s => s.name.toLowerCase().includes(q.toLowerCase()))
    .filter(s => filter === 'all' ? true : filter === 'pending' ? unreadFromStudent(s.id) : true)
    .sort((a,b) => {
      const la = lastMsg(a.id)?.time || 0;
      const lb = lastMsg(b.id)?.time || 0;
      return lb - la;
    });

  const previewBody = (m) => {
    if (!m) return '—';
    if (m.kind === 'text') return m.body;
    if (m.kind === 'audio') return '🎙 ' + (m.body?.duration || 0) + 's';
    if (m.kind === 'image') return { ca:'📷 Imatge', es:'📷 Imagen', en:'📷 Image' }[lang];
    if (m.kind === 'pdf') return '📄 PDF';
    if (m.kind === 'pose') return '🧘 ' + t.pose;
    if (m.kind === 'session') return '✦ ' + t.session;
    if (m.kind === 'quote') return '“ ' + t.quote;
    return '';
  };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--paper)' }}>
      <div style={{ padding:'60px 24px 12px' }}>
        <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.25em', color:'var(--accent)', marginBottom: 4 }}>
          {t.teacherTitle.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 34, fontStyle:'italic', color:'var(--ink)', margin: 0 }}>{t.inboxTitle}</h1>
      </div>

      <div style={{ padding:'4px 18px 8px', display:'flex', gap: 8, alignItems:'center' }}>
        <div style={{ flex: 1, display:'flex', alignItems:'center', gap: 8, background:'var(--cream)',
                      border:'1px solid color-mix(in srgb, var(--ink) 8%, transparent)', borderRadius: 999, padding:'8px 14px' }}>
          <Icon name="search" size={14} color="var(--ink-soft)"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.searchStudents}
            style={{ flex:1, border:'none', outline:'none', background:'transparent', fontFamily:'var(--sans)', fontSize: 13, color:'var(--ink)' }}/>
        </div>
        <button onClick={onBroadcast} aria-label={t.broadcast}
                style={{ width: 40, height: 40, borderRadius:'50%', background:'var(--ink)', color:'var(--cream)',
                         border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="broadcast" size={16} color="var(--cream)"/>
        </button>
      </div>

      <div style={{ padding:'4px 18px 12px', display:'flex', gap: 6 }}>
        <button onClick={()=>setFilter('all')} className={'yb-chip clay' + (filter==='all' ? ' active':'')}>
          {t.recent}
        </button>
        <button onClick={()=>setFilter('pending')} className={'yb-chip clay' + (filter==='pending' ? ' active':'')}>
          {t.needsReply}
        </button>
      </div>

      <div className="yb-scroll" style={{ flex: 1, overflowY:'auto', padding:'4px 12px 100px' }}>
        {filtered.map(s => {
          const m = lastMsg(s.id);
          const unread = unreadFromStudent(s.id);
          return (
            <button key={s.id} onClick={()=>onOpen(s.id)}
              style={{ width:'100%', display:'flex', gap: 12, alignItems:'center',
                       padding:'12px 12px', background:'transparent', border:'none', cursor:'pointer',
                       borderRadius: 16, marginBottom: 2, textAlign:'left', color:'var(--ink)' }}>
              <div style={{ width: 46, height: 46, borderRadius:'50%', background: s.accent,
                            color:'var(--cream)', display:'flex', alignItems:'center', justifyContent:'center',
                            fontFamily:'var(--serif)', fontSize: 19, position:'relative', flexShrink: 0 }}>
                {s.initials}
                {s.online && (
                  <span style={{ position:'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius:'50%', background:'#5BC788', border:'2px solid var(--paper)' }}/>
                )}
              </div>
              <div style={{ flex:1, minWidth: 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 8 }}>
                  <div style={{ fontFamily:'var(--serif)', fontSize: 17, fontStyle:'italic', color:'var(--ink)' }}>{s.name}</div>
                  {m && <div style={{ fontFamily:'var(--sans)', fontSize: 10, color: unread ? 'var(--accent)':'var(--ink-soft)', flexShrink: 0 }}>{fmtDay(m.time, t)}</div>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap: 6, marginTop: 2 }}>
                  <div style={{ flex:1, fontFamily:'var(--sans)', fontSize: 12, color: unread ? 'var(--ink)' : 'var(--ink-soft)',
                                 fontWeight: unread ? 500 : 400,
                                 overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {m && m.from === 'teacher' && <span style={{ opacity: 0.7 }}>{t.me}: </span>}
                    {previewBody(m)}
                  </div>
                  {unread && <span style={{ width: 8, height: 8, borderRadius:'50%', background:'var(--accent)' }}/>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Sheet difusió ──────────────────────────────────────────────────────────
const BroadcastComposerView = ({ t, lang, asanas, students, onClose, onSend }) => {
  const [selected, setSelected] = uSC([]);
  const [stage, setStage] = uSC('select'); // select | compose

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  const allIds = students.map(s=>s.id);
  const allSelected = selected.length === students.length;

  return (
    <div style={{ position:'absolute', inset: 0, background:'var(--paper)', zIndex: 70, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'50px 14px 12px', display:'flex', alignItems:'center', gap: 10,
                    borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
        <button onClick={stage === 'compose' ? () => setStage('select') : onClose}
                style={{ background:'transparent', border:'none', cursor:'pointer', padding: 6 }}>
          <Icon name="back" size={20} color="var(--ink)"/>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily:'var(--sans)', fontSize: 11, letterSpacing:'0.2em', color:'var(--accent)', textTransform:'uppercase' }}>
            {t.broadcast}
          </div>
          <div style={{ fontFamily:'var(--serif)', fontStyle:'italic', fontSize: 19, color:'var(--ink)' }}>
            {stage === 'select' ? t.selectStudents : `${selected.length} ${t.selected}`}
          </div>
        </div>
      </div>

      {stage === 'select' ? (
        <>
          <div style={{ padding:'10px 18px 6px' }}>
            <button onClick={()=>setSelected(allSelected ? [] : allIds)}
              style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--accent)', fontFamily:'var(--sans)', fontSize: 12 }}>
              {allSelected ? t.cancel : `${t.allStudents} (${students.length})`}
            </button>
          </div>
          <div className="yb-scroll" style={{ flex: 1, overflowY:'auto', padding:'4px 14px 14px' }}>
            {students.map(s => {
              const on = selected.includes(s.id);
              return (
                <button key={s.id} onClick={()=>toggle(s.id)}
                  style={{ width:'100%', display:'flex', gap: 12, alignItems:'center',
                           padding:'12px 10px', background: on ? 'color-mix(in srgb, var(--accent) 10%, transparent)':'transparent',
                           border:'none', cursor:'pointer', borderRadius: 14, textAlign:'left',
                           color:'var(--ink)', marginBottom: 4 }}>
                  <div style={{ width: 42, height: 42, borderRadius:'50%', background: s.accent, color:'var(--cream)',
                                display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--serif)', fontSize: 17 }}>
                    {s.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily:'var(--serif)', fontSize: 16, fontStyle:'italic' }}>{s.name}</div>
                    <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)' }}>
                      {s.level} · {s.frequency}×{{ ca:'/setm.', es:'/sem.', en:'/wk' }[lang]}
                    </div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 6,
                                border: '2px solid ' + (on ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 25%, transparent)'),
                                background: on ? 'var(--accent)' : 'transparent',
                                display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {on && <Icon name="check" size={12} color="var(--cream)" strokeWidth={2.4}/>}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ padding:'10px 14px calc(env(safe-area-inset-bottom, 12px) + 14px)',
                         borderTop:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
            <button disabled={selected.length === 0} onClick={()=>setStage('compose')}
              className="yb-btn yb-btn-primary" style={{ width:'100%', opacity: selected.length === 0 ? 0.4 : 1 }}>
              {{ ca:'Continuar', es:'Continuar', en:'Continue' }[lang]} →
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding:'14px 18px', display:'flex', flexWrap:'wrap', gap: 6,
                         borderBottom:'1px solid color-mix(in srgb, var(--ink) 6%, transparent)' }}>
            {selected.map(id => {
              const s = students.find(x=>x.id===id);
              if (!s) return null;
              return (
                <span key={id} className="yb-chip" style={{ padding:'5px 12px', fontSize: 12 }}>
                  <span style={{ width: 18, height: 18, borderRadius:'50%', background: s.accent, color:'var(--cream)',
                                 display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize: 10, fontFamily:'var(--serif)' }}>
                    {s.initials}
                  </span>
                  {s.name}
                </span>
              );
            })}
          </div>
          <div style={{ flex: 1, padding:'18px 18px', display:'flex', flexDirection:'column' }}>
            <div style={{ fontFamily:'var(--sans)', fontSize: 11, color:'var(--ink-soft)', marginBottom: 8 }}>
              {t.composerHint}
            </div>
            <div style={{ flex: 1 }}/>
          </div>
          <Composer t={t} lang={lang} asanas={asanas} role="teacher"
                    broadcastCount={selected.length} isStudent={false}
                    onSend={(payload)=>{ onSend(selected, payload); }}/>
        </>
      )}
    </div>
  );
};

// ── Component principal ─────────────────────────────────────────────────────
const Chat = ({ t: globalT, lang, role = 'student', asanas }) => {
  const t = uMC(() => CHAT_T[lang] || CHAT_T.ca, [lang]);
  const [conversations, setConversations] = uSC(() => seedConversations(lang));
  const [activeStudentId, setActiveStudentId] = uSC(null);
  const [contextOpen, setContextOpen] = uSC(false);
  const [broadcastOpen, setBroadcastOpen] = uSC(false);
  const [privateNotes, setPrivateNotes] = uSC({}); // { [studentId]: [{ body, time }] }

  // Re-sembra els missatges quan canvia la llengua per actualitzar textos mock
  uEC(() => { setConversations(seedConversations(lang)); }, [lang]);

  // Afegeix a la conversa el que s'ha compartit des del Diari/Calendari (bústia local)
  uEC(() => {
    try {
      const shared = (window.EBShare && window.EBShare.load()) || [];
      if (!shared.length) return;
      setConversations(prev => {
        const key = 'nuria';
        const extra = shared.map(s => ({ id: newId(), from: 'student', kind: 'text', body: s.text, time: s.time || Date.now(), status: 'sent', reactions: [] }));
        return { ...prev, [key]: [...(prev[key] || []), ...extra] };
      });
    } catch (e) {}
  }, [lang]);

  // En obrir una conversa, marca els missatges entrants com llegits
  uEC(() => {
    if (!activeStudentId) return;
    setConversations(prev => {
      const arr = (prev[activeStudentId] || []).map(m => {
        if (role === 'teacher' && m.from === 'student' && m.status !== 'read') return { ...m, status:'read' };
        if (role === 'student' && m.from === 'teacher' && m.status !== 'read') return { ...m, status:'read' };
        return m;
      });
      return { ...prev, [activeStudentId]: arr };
    });
  }, [activeStudentId, role]);

  const sendOne = (studentId, payload) => {
    const newMsg = {
      id: newId(),
      from: role,
      kind: payload.kind,
      body: payload.body,
      time: payload.scheduled || Date.now(),
      status: payload.scheduled ? 'scheduled' : 'sent',
      reactions: [],
      private: !!payload.private,
      scheduled: payload.scheduled || null,
      broadcast: payload.broadcast || null,   // ← badge "Difusió · N"
    };
    setConversations(prev => ({
      ...prev,
      [studentId]: [...(prev[studentId] || []), newMsg],
    }));
    // Simula lliurament i resposta
    if (!payload.private && !payload.scheduled) {
      setTimeout(() => {
        setConversations(prev => ({
          ...prev,
          [studentId]: (prev[studentId] || []).map(m => m.id === newMsg.id ? { ...m, status:'delivered' } : m),
        }));
      }, 700);
      // Si l'alumna envia, simula que la professora llegeix ràpid
      if (role === 'student') {
        setTimeout(() => {
          setConversations(prev => ({
            ...prev,
            [studentId]: (prev[studentId] || []).map(m => m.id === newMsg.id ? { ...m, status:'read' } : m),
          }));
        }, 2500);
      }
    }
  };

  const sendBroadcast = (ids, payload) => {
    const broadcastTag = `${ids.length}`;
    ids.forEach(id => {
      // broadcast ja s'inclou dins payload → sendOne el passa a newMsg directament
      sendOne(id, { ...payload, broadcast: broadcastTag });
    });
    setBroadcastOpen(false);
  };

  const reactToMsg = (studentId, msg, emoji) => {
    setConversations(prev => ({
      ...prev,
      [studentId]: (prev[studentId] || []).map(m => {
        if (m.id !== msg.id) return m;
        const exists = (m.reactions || []).find(r => r.emoji === emoji && r.by === role);
        const reactions = exists
          ? m.reactions.filter(r => !(r.emoji === emoji && r.by === role))
          : [...(m.reactions || []), { emoji, by: role }];
        return { ...m, reactions };
      }),
    }));
  };

  const addPrivateNote = (studentId, body) => {
    setPrivateNotes(prev => ({
      ...prev,
      [studentId]: [...(prev[studentId] || []), { body, time: Date.now() }],
    }));
  };
  const removePrivateNote = (studentId, idx) => {
    setPrivateNotes(prev => ({
      ...prev,
      [studentId]: (prev[studentId] || []).filter((_, i) => i !== idx),
    }));
  };

  // TAB_H: alçada aproximada del TabBar (icona + etiqueta + safe-area)
  const TAB_H = 88;

  // ── Vista alumna ───────────────────────────────────────────────────────
  if (role === 'student') {
    const teacher = { id:'teacher', name:'Cèlia', initials:'C', accent:'var(--accent)', online:true, level:'—', frequency:5, focus:[], injuries:[], goals:[], lastPracticeDays: 0 };
    const studentMsgs = conversations.nuria || [];
    return (
      // Limita l'alçada per deixar espai al TabBar
      <div style={{ height: `calc(100% - ${TAB_H}px)`, display:'flex', flexDirection:'column' }}>
        <ConversationView t={t} lang={lang} asanas={asanas} role="student"
          student={teacher}
          messages={studentMsgs}
          onSend={(payload)=>sendOne('nuria', payload)}
          onReact={(msg, emoji)=>reactToMsg('nuria', msg, emoji)}/>
      </div>
    );
  }

  // ── Vista professora ─────────────────────────────────────────────────────
  const activeStudent = MOCK_STUDENTS.find(s => s.id === activeStudentId);

  return (
    <>
      {/* Safata: respecta el TabBar */}
      {!activeStudentId && (
        <div style={{ height: `calc(100% - ${TAB_H}px)`, display:'flex', flexDirection:'column' }}>
          <StudentInbox t={t} lang={lang} students={MOCK_STUDENTS} conversations={conversations}
            onOpen={(id)=>setActiveStudentId(id)}
            onBroadcast={()=>setBroadcastOpen(true)}/>
        </div>
      )}
      {/* Conversa individual: cobreix tot (com PoseDetail) */}
      {activeStudentId && activeStudent && (
        <div style={{ position:'absolute', inset:0, zIndex:30, background:'var(--paper)' }}>
          <ConversationView t={t} lang={lang} asanas={asanas} role="teacher"
            student={activeStudent}
            messages={conversations[activeStudentId] || []}
            onSend={(payload)=>sendOne(activeStudentId, payload)}
            onReact={(msg, emoji)=>reactToMsg(activeStudentId, msg, emoji)}
            onBack={()=>setActiveStudentId(null)}
            onOpenContext={()=>setContextOpen(true)}/>
        </div>
      )}
      {activeStudentId && activeStudent && (
        <ContextDrawer open={contextOpen} onClose={()=>setContextOpen(false)}
          t={t} lang={lang} student={activeStudent}
          privateNotes={privateNotes[activeStudentId]}
          onAddNote={(body)=>addPrivateNote(activeStudentId, body)}
          onRemoveNote={(i)=>removePrivateNote(activeStudentId, i)}/>
      )}
      {broadcastOpen && (
        <BroadcastComposerView t={t} lang={lang} asanas={asanas} students={MOCK_STUDENTS}
          onClose={()=>setBroadcastOpen(false)}
          onSend={sendBroadcast}/>
      )}
    </>
  );
};

window.Chat = Chat;
