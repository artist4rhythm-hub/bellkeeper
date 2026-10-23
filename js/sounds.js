// 벨키퍼 소리 재생
// - 기본 종소리(수업 시작·끝 종, 학교종·차임 등): 벨키퍼가 직접 합성해 만든 소리라 저작권 걱정 없이 무료로 써요.
//   멜로디는 저작권이 끝난 곡(공개 저작물)만 썼어요. 파일은 sounds/ 폴더에 있고, 인터넷이 끊겨도 울려요.
// - 올린 소리·음악: 오디오 파일을 미리 불러 두었다가 재생
// - 안내 문구: Google 고음질 음성으로 만든 파일, 또는 기기에 들어 있는 음성

export const SOUND_CATS = [
  { id: 'start', label: '수업 시작 종', group: 'school' },
  { id: 'end', label: '수업 끝 종', group: 'school' },
  { id: 'chime', label: '학교종·차임', group: 'school' },
  { id: 'bell', label: '종', group: 'school' },
  { id: 'world', label: '세계의 종', group: 'school' },
  { id: 'melody', label: '짧은 멜로디', group: 'music' },
  { id: 'long', label: '긴 멜로디', group: 'music' },
  { id: 'hymn', label: '찬송가·성가', group: 'music' },
  { id: 'ring', label: '알림·벨소리', group: 'music' },
  { id: 'alert', label: '경보·작업장', group: 'music' },
  { id: 'calm', label: '명상·쉼', group: 'music' },
  { id: 'steel', label: '스틸드럼 징글', group: 'jingle' },
  { id: 'pizzi', label: '피치카토 징글', group: 'jingle' },
  { id: 'sax', label: '색소폰 징글', group: 'jingle' },
  { id: 'nes', label: '8비트 징글', group: 'jingle' },
  { id: 'hit', label: '효과 징글', group: 'jingle' },
  { id: 'digital', label: '전자음', group: 'jingle' },
  { id: 'bgm', label: '배경음악', group: 'bgm' }
];
export const BGM_MOODS = [
  { id: 'piano', label: '잔잔한 피아노' }, { id: 'morning', label: '아침·밝게' }, { id: 'lofi', label: '로파이' },
  { id: 'nature', label: '자연·오케스트라' }, { id: 'game', label: '신나게' }
];

export const BUILTIN_SOUNDS = [
  { id: "b:lg_ode", name: "환희의 송가 (전곡)", cat: 'long', desc: "베토벤 · 첼레스타와 피아노", sec: 31.2, file: "sounds2/lg_ode.mp3" },
  { id: "b:lg_elise", name: "엘리제를 위하여 (피아노)", cat: 'long', desc: "베토벤 · 첫 부분 두 번", sec: 22.1, file: "sounds2/lg_elise.mp3" },
  { id: "b:lg_twinkle", name: "반짝반짝 작은별 (전곡)", cat: 'long', desc: "오르골 · 유치원·초등", sec: 22.2, file: "sounds2/lg_twinkle.mp3" },
  { id: "b:lg_minuet", name: "미뉴에트 G장조 (전곡)", cat: 'long', desc: "바흐/페촐트 · 하프시코드풍", sec: 19.4, file: "sounds2/lg_minuet.mp3" },
  { id: "b:lg_greensleeves", name: "그린슬리브스 (하프)", cat: 'long', desc: "영국 민요 · 점심·쉬는 시간", sec: 22.5, file: "sounds2/lg_greensleeves.mp3" },
  { id: "b:lg_brahms", name: "브람스 자장가 (전곡)", cat: 'long', desc: "오르골 → 첼레스타 · 하교·낮잠", sec: 27.0, file: "sounds2/lg_brahms.mp3" },
  { id: "b:lg_canon", name: "캐논 (편곡)", cat: 'long', desc: "파헬벨 · 피아노·오르골·현악 · 30초", sec: 29.9, file: "sounds2/lg_canon.mp3" },
  { id: "b:lg_turca", name: "터키 행진곡 (모차르트)", cat: 'long', desc: "첫 부분 · 피아노 · 활기차게", sec: 11.3, file: "sounds2/lg_turca.mp3" },
  { id: "b:lg_nacht", name: "아이네 클라이네 나흐트무지크", cat: 'long', desc: "모차르트 · 마림바와 현악", sec: 13.4, file: "sounds2/lg_nacht.mp3" },
  { id: "b:lg_spring", name: "사계 중 봄 (비발디)", cat: 'long', desc: "첼레스타와 현악 · 아침", sec: 15.1, file: "sounds2/lg_spring.mp3" },
  { id: "b:lg_frere", name: "프레르 자크 돌림노래 (3성부)", cat: 'long', desc: "오르골·첼레스타·마림바가 차례로", sec: 33.5, file: "sounds2/lg_frere.mp3" },
  { id: "b:lg_rowboat", name: "노 젓자 돌림노래 (3성부)", cat: 'long', desc: "Row, Row, Row Your Boat · 실로폰·비브라폰·마림바", sec: 24.5, file: "sounds2/lg_rowboat.mp3" },
  { id: "b:lg_mary", name: "메리의 어린 양 (실로폰)", cat: 'long', desc: "미국 동요 · 어린이반", sec: 13.7, file: "sounds2/lg_mary.mp3" },
  { id: "b:lg_london", name: "런던 다리 (오르골)", cat: 'long', desc: "영국 동요", sec: 14.6, file: "sounds2/lg_london.mp3" },
  { id: "b:lg_jingle", name: "징글벨 (크리스마스)", cat: 'long', desc: "글로켄과 썰매 방울 · 12월", sec: 23.5, file: "sounds2/lg_jingle.mp3" },
  { id: "b:hy_silent", name: "고요한 밤 거룩한 밤", cat: 'hymn', desc: "그루버 1818 · 오르골과 오르간", sec: 32.1, file: "sounds2/hy_silent.mp3" },
  { id: "b:hy_doxology", name: "만복의 근원 하나님 (올드 헌드레드)", cat: 'hymn', desc: "1551 · 오르간 · 예배 시작", sec: 25.8, file: "sounds2/hy_doxology.mp3" },
  { id: "b:hy_grace", name: "나 같은 죄인 살리신 (어메이징 그레이스)", cat: 'hymn', desc: "피아노 → 핸드벨 · 두 번", sec: 28.3, file: "sounds2/hy_grace.mp3" },
  { id: "b:hy_joyworld", name: "기쁘다 구주 오셨네", cat: 'hymn', desc: "헨델/메이슨 · 핸드벨과 오르간", sec: 14.9, file: "sounds2/hy_joyworld.mp3" },
  { id: "b:hy_joyful", name: "기뻐하며 경배하세", cat: 'hymn', desc: "베토벤 환희의 송가 찬송 · 오르간", sec: 11.7, file: "sounds2/hy_joyful.mp3" },
  { id: "b:w_us_bell", name: "미국 학교 전기벨", cat: 'world', desc: "따르르르릉 4초 · 미국·영국 학교", sec: 5.4, file: "sounds2/w_us_bell.mp3" },
  { id: "b:w_us_pa", name: "미국 학교 방송 톤", cat: 'world', desc: "뿌- 뿌- 뿌- · 교실 스피커 신호", sec: 3.0, file: "sounds2/w_us_pa.mp3" },
  { id: "b:w_uk_handbell", name: "영국 학교 놋쇠 손종", cat: 'world', desc: "선생님이 마당에서 흔드는 큰 손종", sec: 5.6, file: "sounds2/w_uk_handbell.mp3" },
  { id: "b:w_de_gong", name: "독일 학교 쉬는 시간 공", cat: 'world', desc: "파우젠공 · 솔미도 깊은 3음", sec: 11.9, file: "sounds2/w_de_gong.mp3" },
  { id: "b:w_jp_chime", name: "일본 학교 킨콘칸콘", cat: 'world', desc: "전자 차임 · 느리게 떨리는 소리", sec: 11.2, file: "sounds2/w_jp_chime.mp3" },
  { id: "b:w_eu_station", name: "유럽 역 안내 차임", cat: 'world', desc: "높은 3음 하강 · 기차역·공항", sec: 5.8, file: "sounds2/w_eu_station.mp3" },
  { id: "b:w_uk_change", name: "영국 교회 체인지 링잉", cat: 'world', desc: "6개 종이 순서를 바꿔 가며 · 20초", sec: 30.0, file: "sounds2/w_uk_change.mp3" },
  { id: "b:w_ru_zvon", name: "러시아 정교회 종 (즈본)", cat: 'world', desc: "큰 종·중간 종·작은 종이 함께 · 15초", sec: 19.3, file: "sounds2/w_ru_zvon.mp3" },
  { id: "b:w_it_peal", name: "이탈리아 성당 종", cat: 'world', desc: "흔들리며 울리는 4개 종 · 12초", sec: 18.3, file: "sounds2/w_it_peal.mp3" },
  { id: "b:w_bigben", name: "빅벤 정각 (런던 시계탑풍)", cat: 'world', desc: "웨스트민스터 4소절 + 큰 종 세 번 · 25초", sec: 31.0, file: "sounds2/w_bigben.mp3" },
  { id: "b:w_ship", name: "배의 종", cat: 'world', desc: "땡땡 땡땡 땡땡 · 항해 시간 알림", sec: 6.2, file: "sounds2/w_ship.mp3" },
  { id: "b:w_cowbell", name: "알프스 카우벨", cat: 'world', desc: "스위스 들판의 소 방울 · 7초", sec: 8.9, file: "sounds2/w_cowbell.mp3" },
  { id: "b:w_gamelan", name: "인도네시아 가믈란", cat: 'world', desc: "쇠 건반 선율과 큰 공 · 발리", sec: 13.4, file: "sounds2/w_gamelan.mp3" },
  { id: "b:w_bianzhong", name: "중국 편종", cat: 'world', desc: "청동 종 5음 선율 · 고대 궁중 음악풍", sec: 11.8, file: "sounds2/w_bianzhong.mp3" },
  { id: "b:w_pyeonjong", name: "한국 편종 (국악풍)", cat: 'world', desc: "황·태·중·임·남 다섯 음 · 국악 아침", sec: 10.3, file: "sounds2/w_pyeonjong.mp3" },
  { id: "b:w_ghanta", name: "인도 사원 종 (간타)", cat: 'world', desc: "손에 들고 흔드는 맑은 종 · 5초", sec: 7.6, file: "sounds2/w_ghanta.mp3" },
  { id: "b:w_tingsha", name: "티베트 틴샤", cat: 'world', desc: "작은 심벌 두 개 · 맥놀이가 긴 명상 소리", sec: 15.4, file: "sounds2/w_tingsha.mp3" },
  { id: "b:st_west_echime", name: "웨스트민스터 (방송실 차임)", cat: 'start', desc: "학교 방송 차임 그대로 · 8음", sec: 9.4 },
  { id: "b:st_west_piano", name: "웨스트민스터 (피아노)", cat: 'start', desc: "8음 · 부드럽게", sec: 8.9 },
  { id: "b:st_west_box", name: "웨스트민스터 (오르골)", cat: 'start', desc: "8음 · 유치원·초등", sec: 6.4 },
  { id: "b:st_west_marimba", name: "웨스트민스터 (마림바)", cat: 'start', desc: "8음 · 따뜻한 나무 소리", sec: 5.8 },
  { id: "b:st_west_handbell", name: "웨스트민스터 (핸드벨)", cat: 'start', desc: "8음 · 교회 학교", sec: 8.7 },
  { id: "b:st_west_celesta", name: "웨스트민스터 (첼레스타)", cat: 'start', desc: "8음 · 맑고 높게", sec: 6.8 },
  { id: "b:st_tower8", name: "탑시계 8음 차임", cat: 'start', desc: "도시레라솔파미레도 하강 · 휘팅턴풍", sec: 10.6 },
  { id: "b:st_tower_call", name: "탑시계 부름 차임", cat: 'start', desc: "미레도솔 · 도레미도", sec: 12.0 },
  { id: "b:st_echime3", name: "띵동댕 (방송실 차임)", cat: 'start', desc: "올라가는 3음 · 방송 시작", sec: 6.3 },
  { id: "b:st_echime4", name: "띵동댕동 (방송실 차임)", cat: 'start', desc: "올라가는 4음", sec: 6.8 },
  { id: "b:st_handbell4", name: "핸드벨 도미솔도", cat: 'start', desc: "밝게 올라가는 4음", sec: 6.0 },
  { id: "b:st_xylo", name: "실로폰 도레미파솔도", cat: 'start', desc: "어린이반 · 짧게", sec: 2.5 },
  { id: "b:st_morning", name: "아침 기분 (그리그)", cat: 'start', desc: "페르 귄트 · 첼레스타 · 아침 첫 종", sec: 7.8 },
  { id: "b:st_nacht", name: "아이네 클라이네 (모차르트)", cat: 'start', desc: "힘차게 시작 · 마림바", sec: 4.1 },
  { id: "b:st_frere", name: "프레르 자크 (오르골)", cat: 'start', desc: "돌림노래 · 공개 저작물", sec: 7.4 },
  { id: "b:st_arirang", name: "아리랑 (가야금풍)", cat: 'start', desc: "전래 민요 첫 소절", sec: 7.4 },
  { id: "b:st_bugle", name: "나팔 신호 (시작)", cat: 'start', desc: "빰빰빰 빠- · 운동회·체육", sec: 3.2 },
  { id: "b:st_harp_up", name: "하프 올라가기", cat: 'start', desc: "꿈결 같은 시작", sec: 4.0 },
  { id: "b:st_piano_arp", name: "피아노 펼침화음 올라가기", cat: 'start', desc: "도솔도미솔도", sec: 5.3 },
  { id: "b:st_ebell", name: "전기종 따르릉 (옛날 학교)", cat: 'start', desc: "3초 · 운동장까지 들리게", sec: 4.8 },
  { id: "b:st_ebell_long", name: "전기종 길게", cat: 'start', desc: "6초 · 쉬는 시간 끝", sec: 7.8 },
  { id: "b:st_school_bell", name: "학교 손종 땡땡땡", cat: 'start', desc: "선생님이 흔드는 종 · 4초", sec: 6.7 },
  { id: "b:en_west_echime", name: "웨스트민스터 마침 (방송실 차임)", cat: 'end', desc: "솔레미도 · 도 · 차분하게", sec: 7.8 },
  { id: "b:en_west_hour", name: "웨스트민스터 + 큰 종 세 번", cat: 'end', desc: "시계탑 정각처럼 · 하교", sec: 18.4 },
  { id: "b:en_west_piano", name: "웨스트민스터 마침 (피아노)", cat: 'end', desc: "낮고 부드럽게", sec: 7.7 },
  { id: "b:en_echime3", name: "댕동띵 (방송실 차임)", cat: 'end', desc: "내려가는 3음 · 방송 끝", sec: 6.3 },
  { id: "b:en_echime4", name: "댕동띵동 (방송실 차임)", cat: 'end', desc: "내려가는 4음", sec: 6.6 },
  { id: "b:en_handbell4", name: "핸드벨 도솔미도", cat: 'end', desc: "차분히 내려가는 4음", sec: 6.1 },
  { id: "b:en_xylo", name: "실로폰 도솔파미레도", cat: 'end', desc: "어린이반 · 짧게", sec: 2.6 },
  { id: "b:en_goinghome", name: "꿈속의 고향 (드보르자크)", cat: 'end', desc: "신세계 교향곡 2악장 · 하교 음악", sec: 7.2 },
  { id: "b:en_auld", name: "석별의 정 (올드 랭 사인)", cat: 'end', desc: "스코틀랜드 민요 · 마치는 날", sec: 8.0 },
  { id: "b:en_grace", name: "어메이징 그레이스 (핸드벨)", cat: 'end', desc: "찬송 ‘나 같은 죄인 살리신’ · 공개 저작물", sec: 11.2 },
  { id: "b:en_amen", name: "아멘 (오르간)", cat: 'end', desc: "두 화음 · 예배·기도 마침", sec: 5.4 },
  { id: "b:en_harp_down", name: "하프 내려가기", cat: 'end', desc: "부드럽게 마무리", sec: 4.9 },
  { id: "b:en_piano_arp", name: "피아노 펼침화음 내려가기", cat: 'end', desc: "도솔미도솔도", sec: 5.5 },
  { id: "b:en_bowl", name: "싱잉볼 마침", cat: 'end', desc: "길게 퍼지는 쉼 · 쉬는 시간 시작", sec: 10.8 },
  { id: "b:en_ebell", name: "전기종 짧게", cat: 'end', desc: "1.5초 · 따르릉", sec: 3.3 },
  { id: "b:en_school_bell", name: "학교 손종 두 번", cat: 'end', desc: "땡- 땡- · 조용히", sec: 4.5 },
  { id: "b:en_bugle", name: "나팔 신호 (마침)", cat: 'end', desc: "빠- 빠빠 빠- · 체육 마침", sec: 3.1 },
  { id: "b:en_gayageum", name: "가야금 마침", cat: 'end', desc: "레시라솔 미레솔 · 우리 가락", sec: 5.1 },
  { id: "b:westminster", name: "웨스트민스터 차임", cat: 'chime', desc: "딩동댕동 8음 · 학교종의 대표", sec: 12.1 },
  { id: "b:westminster4", name: "웨스트민스터 짧게", cat: 'chime', desc: "4음", sec: 9.8 },
  { id: "b:westminster16", name: "웨스트민스터 정시", cat: 'chime', desc: "시계탑 정시 멜로디 · 길게", sec: 19.1 },
  { id: "b:dingdong", name: "딩동", cat: 'chime', desc: "부드러운 2음", sec: 6.8 },
  { id: "b:up3", name: "안내 시작", cat: 'chime', desc: "올라가는 3음", sec: 6.8 },
  { id: "b:down3", name: "안내 끝", cat: 'chime', desc: "내려가는 3음", sec: 6.8 },
  { id: "b:airport", name: "공항 안내 차임", cat: 'chime', desc: "맑은 4음 상승", sec: 7.4 },
  { id: "b:airport_end", name: "공항 안내 끝", cat: 'chime', desc: "맑은 4음 하강", sec: 7.5 },
  { id: "b:vibes4", name: "비브라폰 차임", cat: 'chime', desc: "부드럽게 떨리는 4음", sec: 6.2 },
  { id: "b:glock_up", name: "글로켄 반짝", cat: 'chime', desc: "밝게 올라가는 5음", sec: 4.7 },
  { id: "b:church", name: "교회 종", cat: 'bell', desc: "큰 종 세 번", sec: 15.9 },
  { id: "b:church2", name: "교회 종 두 음", cat: 'bell', desc: "높고 낮은 두 종", sec: 15.1 },
  { id: "b:temple", name: "범종", cat: 'bell', desc: "낮고 깊은 울림 · 14초", sec: 15.2 },
  { id: "b:handbell", name: "손종 흔들기", cat: 'bell', desc: "땡그랑땡그랑 · 교실 종", sec: 6.3 },
  { id: "b:handbell3", name: "핸드벨 3음", cat: 'bell', desc: "솔미도", sec: 5.8 },
  { id: "b:desk", name: "호텔 데스크 벨", cat: 'bell', desc: "띵 · 짧게", sec: 5.1 },
  { id: "b:desk2", name: "데스크 벨 두 번", cat: 'bell', desc: "띵띵", sec: 4.7 },
  { id: "b:bicycle", name: "자전거 벨", cat: 'bell', desc: "띠링띠링", sec: 2.0 },
  { id: "b:windchime", name: "풍경", cat: 'bell', desc: "바람에 흔들리는 맑은 소리", sec: 10.0 },
  { id: "b:triangle", name: "트라이앵글", cat: 'bell', desc: "챙", sec: 6.1 },
  { id: "b:elise_box", name: "엘리제를 위하여 (오르골)", cat: 'melody', desc: "베토벤 · 공개 저작물", sec: 7.5 },
  { id: "b:elise_marimba", name: "엘리제를 위하여 (마림바)", cat: 'melody', desc: "베토벤 · 공개 저작물", sec: 6.3 },
  { id: "b:joy", name: "환희의 송가", cat: 'melody', desc: "베토벤 · 비브라폰", sec: 9.3 },
  { id: "b:twinkle", name: "반짝반짝 작은별", cat: 'melody', desc: "전래 동요 · 오르골", sec: 7.1 },
  { id: "b:brahms", name: "브람스 자장가", cat: 'melody', desc: "오르골 · 하교·취침용", sec: 7.6 },
  { id: "b:minuet", name: "미뉴에트 G장조", cat: 'melody', desc: "페촐트 · 마림바", sec: 6.3 },
  { id: "b:canon", name: "캐논", cat: 'melody', desc: "파헬벨 · 글로켄슈필", sec: 7.7 },
  { id: "b:fanfare", name: "시작 팡파르", cat: 'melody', desc: "짧고 힘차게 · 마림바", sec: 3.3 },
  { id: "b:phone", name: "옛날 전화벨", cat: 'ring', desc: "따르르릉 두 번", sec: 3.5 },
  { id: "b:alarmclock", name: "자명종", cat: 'ring', desc: "따르르르릉", sec: 3.5 },
  { id: "b:digital", name: "디지털 알람", cat: 'ring', desc: "삐삐삐삐 세 번", sec: 2.8 },
  { id: "b:notify_soft", name: "부드러운 알림", cat: 'ring', desc: "톡톡", sec: 2.4 },
  { id: "b:notify_bright", name: "밝은 알림", cat: 'ring', desc: "반짝 3음", sec: 4.3 },
  { id: "b:correct", name: "정답", cat: 'ring', desc: "딩동댕", sec: 2.6 },
  { id: "b:chord", name: "화음 한 번", cat: 'ring', desc: "도미솔 함께", sec: 5.5 },
  { id: "b:woodblock", name: "목탁", cat: 'ring', desc: "톡 톡 톡", sec: 1.8 },
  { id: "b:buzzer", name: "부저", cat: 'alert', desc: "작업장 시작·종료 · 2초", sec: 2.7 },
  { id: "b:whistle", name: "호루라기", cat: 'alert', desc: "삐익 두 번 · 체육 시간", sec: 4.2 },
  { id: "b:siren", name: "사이렌", cat: 'alert', desc: "비상 대피 훈련용 · 5초", sec: 5.7 },
  { id: "b:warning", name: "주의 알림", cat: 'alert', desc: "삐-뽀 세 번", sec: 4.1 },
  { id: "b:bowl", name: "싱잉볼", cat: 'calm', desc: "길고 맑은 울림 · 12초", sec: 12.4 },
  { id: "b:gong", name: "징", cat: 'calm', desc: "둥- 깊게 퍼지는 소리", sec: 11.1 },
  { id: "b:bowl2", name: "싱잉볼 두 번", cat: 'calm', desc: "쉬는 시간·명상", sec: 11.1 }
];
// 무료(CC0) 음원 — 짧은 멜로디·전자음: Kenney(kenney.nl) / 배경음악: OpenGameArt.org 작가들
BUILTIN_SOUNDS.push(
  {"id": "b:sax01", "name": "색소폰 징글 1", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_sax", "start": 0.0, "dur": 0.3623},
  {"id": "b:sax02", "name": "색소폰 징글 2", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_sax", "start": 0.9623, "dur": 0.8595},
  {"id": "b:sax03", "name": "색소폰 징글 3", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_sax", "start": 2.4218, "dur": 0.8396},
  {"id": "b:sax04", "name": "색소폰 징글 4", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 1.1, "sprite": "pack_sax", "start": 3.8614, "dur": 1.1065},
  {"id": "b:sax05", "name": "색소폰 징글 5", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_sax", "start": 5.5679, "dur": 0.3906},
  {"id": "b:sax06", "name": "색소폰 징글 6", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_sax", "start": 6.5585, "dur": 0.4348},
  {"id": "b:sax07", "name": "색소폰 징글 7", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_sax", "start": 7.5933, "dur": 0.5149},
  {"id": "b:sax08", "name": "색소폰 징글 8", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 1.7, "sprite": "pack_sax", "start": 8.7082, "dur": 1.7401},
  {"id": "b:sax09", "name": "색소폰 징글 9", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_sax", "start": 11.0483, "dur": 0.3843},
  {"id": "b:sax10", "name": "색소폰 징글 10", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_sax", "start": 12.0326, "dur": 0.3729},
  {"id": "b:sax11", "name": "색소폰 징글 11", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_sax", "start": 13.0055, "dur": 0.5977},
  {"id": "b:sax12", "name": "색소폰 징글 12", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_sax", "start": 14.2032, "dur": 0.6185},
  {"id": "b:sax13", "name": "색소폰 징글 13", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_sax", "start": 15.4217, "dur": 0.8523},
  {"id": "b:sax14", "name": "색소폰 징글 14", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_sax", "start": 16.874, "dur": 0.7586},
  {"id": "b:sax15", "name": "색소폰 징글 15", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_sax", "start": 18.2326, "dur": 0.734},
  {"id": "b:sax16", "name": "색소폰 징글 16", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_sax", "start": 19.5666, "dur": 0.6037},
  {"id": "b:sax17", "name": "색소폰 징글 17", "cat": "sax", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_sax", "start": 20.7703, "dur": 0.3953},
  {"id": "b:steel01", "name": "스틸드럼 징글 1", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_steel", "start": 0.0, "dur": 0.9328},
  {"id": "b:steel02", "name": "스틸드럼 징글 2", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.4, "sprite": "pack_steel", "start": 1.5328, "dur": 1.3753},
  {"id": "b:steel03", "name": "스틸드럼 징글 3", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.4, "sprite": "pack_steel", "start": 3.5081, "dur": 1.3873},
  {"id": "b:steel04", "name": "스틸드럼 징글 4", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.4, "sprite": "pack_steel", "start": 5.4954, "dur": 1.3873},
  {"id": "b:steel05", "name": "스틸드럼 징글 5", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_steel", "start": 7.4826, "dur": 0.9089},
  {"id": "b:steel06", "name": "스틸드럼 징글 6", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_steel", "start": 8.9915, "dur": 0.9448},
  {"id": "b:steel07", "name": "스틸드럼 징글 7", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.4, "sprite": "pack_steel", "start": 10.5363, "dur": 1.3753},
  {"id": "b:steel08", "name": "스틸드럼 징글 8", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.6, "sprite": "pack_steel", "start": 12.5116, "dur": 1.5547},
  {"id": "b:steel09", "name": "스틸드럼 징글 9", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_steel", "start": 14.6663, "dur": 0.8013},
  {"id": "b:steel10", "name": "스틸드럼 징글 10", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_steel", "start": 16.0676, "dur": 0.586},
  {"id": "b:steel11", "name": "스틸드럼 징글 11", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_steel", "start": 17.2536, "dur": 0.9089},
  {"id": "b:steel12", "name": "스틸드럼 징글 12", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_steel", "start": 18.7624, "dur": 0.8252},
  {"id": "b:steel13", "name": "스틸드럼 징글 13", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.3, "sprite": "pack_steel", "start": 20.1876, "dur": 1.2557},
  {"id": "b:steel14", "name": "스틸드럼 징글 14", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.1, "sprite": "pack_steel", "start": 22.0433, "dur": 1.0524},
  {"id": "b:steel15", "name": "스틸드럼 징글 15", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 1.4, "sprite": "pack_steel", "start": 23.6957, "dur": 1.3753},
  {"id": "b:steel16", "name": "스틸드럼 징글 16", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_steel", "start": 25.671, "dur": 0.9448},
  {"id": "b:steel17", "name": "스틸드럼 징글 17", "cat": "steel", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_steel", "start": 27.2158, "dur": 0.9089},
  {"id": "b:pizzi01", "name": "피치카토 징글 1", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_pizzi", "start": 0.0, "dur": 0.4942},
  {"id": "b:pizzi02", "name": "피치카토 징글 2", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 1.0, "sprite": "pack_pizzi", "start": 1.0942, "dur": 0.992},
  {"id": "b:pizzi03", "name": "피치카토 징글 3", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 1.0, "sprite": "pack_pizzi", "start": 2.6861, "dur": 0.9504},
  {"id": "b:pizzi04", "name": "피치카토 징글 4", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 1.1, "sprite": "pack_pizzi", "start": 4.2365, "dur": 1.1439},
  {"id": "b:pizzi05", "name": "피치카토 징글 5", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_pizzi", "start": 5.9805, "dur": 0.5595},
  {"id": "b:pizzi06", "name": "피치카토 징글 6", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_pizzi", "start": 7.1399, "dur": 0.5332},
  {"id": "b:pizzi07", "name": "피치카토 징글 7", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_pizzi", "start": 8.2731, "dur": 0.69},
  {"id": "b:pizzi08", "name": "피치카토 징글 8", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 1.3, "sprite": "pack_pizzi", "start": 9.563, "dur": 1.324},
  {"id": "b:pizzi09", "name": "피치카토 징글 9", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_pizzi", "start": 11.4871, "dur": 0.5657},
  {"id": "b:pizzi10", "name": "피치카토 징글 10", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_pizzi", "start": 12.6527, "dur": 0.564},
  {"id": "b:pizzi11", "name": "피치카토 징글 11", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_pizzi", "start": 13.8167, "dur": 0.7972},
  {"id": "b:pizzi12", "name": "피치카토 징글 12", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_pizzi", "start": 15.2139, "dur": 0.7925},
  {"id": "b:pizzi13", "name": "피치카토 징글 13", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 1.0, "sprite": "pack_pizzi", "start": 16.6065, "dur": 0.993},
  {"id": "b:pizzi14", "name": "피치카토 징글 14", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_pizzi", "start": 18.1995, "dur": 0.8811},
  {"id": "b:pizzi15", "name": "피치카토 징글 15", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_pizzi", "start": 19.6807, "dur": 0.9231},
  {"id": "b:pizzi16", "name": "피치카토 징글 16", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_pizzi", "start": 21.2037, "dur": 0.8019},
  {"id": "b:pizzi17", "name": "피치카토 징글 17", "cat": "pizzi", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_pizzi", "start": 22.6056, "dur": 0.4615},
  {"id": "b:nes01", "name": "8비트 징글 1", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 1.8, "sprite": "pack_nes", "start": 0.0, "dur": 1.7578},
  {"id": "b:nes02", "name": "8비트 징글 2", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_nes", "start": 2.3578, "dur": 0.369},
  {"id": "b:nes03", "name": "8비트 징글 3", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_nes", "start": 3.3269, "dur": 0.3799},
  {"id": "b:nes04", "name": "8비트 징글 4", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_nes", "start": 4.3068, "dur": 0.5832},
  {"id": "b:nes05", "name": "8비트 징글 5", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_nes", "start": 5.49, "dur": 0.5843},
  {"id": "b:nes06", "name": "8비트 징글 6", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_nes", "start": 6.6743, "dur": 0.8572},
  {"id": "b:nes07", "name": "8비트 징글 7", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_nes", "start": 8.1315, "dur": 0.7437},
  {"id": "b:nes08", "name": "8비트 징글 8", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_nes", "start": 9.4753, "dur": 0.7351},
  {"id": "b:nes09", "name": "8비트 징글 9", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_nes", "start": 10.8104, "dur": 0.5933},
  {"id": "b:nes10", "name": "8비트 징글 10", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_nes", "start": 12.0037, "dur": 0.3932},
  {"id": "b:nes11", "name": "8비트 징글 11", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_nes", "start": 12.9968, "dur": 0.3806},
  {"id": "b:nes12", "name": "8비트 징글 12", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_nes", "start": 13.9774, "dur": 0.8087},
  {"id": "b:nes13", "name": "8비트 징글 13", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.8, "sprite": "pack_nes", "start": 15.3861, "dur": 0.8247},
  {"id": "b:nes14", "name": "8비트 징글 14", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 1.0, "sprite": "pack_nes", "start": 16.8107, "dur": 1.0204},
  {"id": "b:nes15", "name": "8비트 징글 15", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_nes", "start": 18.4311, "dur": 0.3637},
  {"id": "b:nes16", "name": "8비트 징글 16", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_nes", "start": 19.3949, "dur": 0.3834},
  {"id": "b:nes17", "name": "8비트 징글 17", "cat": "nes", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_nes", "start": 20.3783, "dur": 0.4893},
  {"id": "b:hit01", "name": "효과 징글 1", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.3, "sprite": "pack_hit", "start": 0.0, "dur": 0.272},
  {"id": "b:hit02", "name": "효과 징글 2", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_hit", "start": 0.872, "dur": 0.5013},
  {"id": "b:hit03", "name": "효과 징글 3", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_hit", "start": 1.9733, "dur": 0.5034},
  {"id": "b:hit04", "name": "효과 징글 4", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_hit", "start": 3.0767, "dur": 0.7337},
  {"id": "b:hit05", "name": "효과 징글 5", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_hit", "start": 4.4104, "dur": 0.6281},
  {"id": "b:hit06", "name": "효과 징글 6", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.6, "sprite": "pack_hit", "start": 5.6385, "dur": 0.6107},
  {"id": "b:hit07", "name": "효과 징글 7", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.5, "sprite": "pack_hit", "start": 6.8492, "dur": 0.504},
  {"id": "b:hit08", "name": "효과 징글 8", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.3, "sprite": "pack_hit", "start": 7.9532, "dur": 0.2733},
  {"id": "b:hit09", "name": "효과 징글 9", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.3, "sprite": "pack_hit", "start": 8.8265, "dur": 0.262},
  {"id": "b:hit10", "name": "효과 징글 10", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_hit", "start": 9.6885, "dur": 0.7264},
  {"id": "b:hit11", "name": "효과 징글 11", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.7, "sprite": "pack_hit", "start": 11.0149, "dur": 0.7437},
  {"id": "b:hit12", "name": "효과 징글 12", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.9, "sprite": "pack_hit", "start": 12.3586, "dur": 0.948},
  {"id": "b:hit13", "name": "효과 징글 13", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.3, "sprite": "pack_hit", "start": 13.9066, "dur": 0.2642},
  {"id": "b:hit14", "name": "효과 징글 14", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.3, "sprite": "pack_hit", "start": 14.7708, "dur": 0.2735},
  {"id": "b:hit15", "name": "효과 징글 15", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.4, "sprite": "pack_hit", "start": 15.6443, "dur": 0.4065},
  {"id": "b:hit16", "name": "효과 징글 16", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 1.2, "sprite": "pack_hit", "start": 16.6508, "dur": 1.163},
  {"id": "b:hit17", "name": "효과 징글 17", "cat": "hit", "desc": "짧은 멜로디 · Kenney", "sec": 0.3, "sprite": "pack_hit", "start": 18.4138, "dur": 0.2855},
  {"id": "b:dg_threetone1", "name": "전자 3음 1", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.6, "sprite": "pack_digital", "start": 0.0, "dur": 0.5608},
  {"id": "b:dg_threetone2", "name": "전자 3음 2", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.6, "sprite": "pack_digital", "start": 1.1608, "dur": 0.6476},
  {"id": "b:dg_twotone1", "name": "전자 2음 1", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.6, "sprite": "pack_digital", "start": 2.4084, "dur": 0.619},
  {"id": "b:dg_twotone2", "name": "전자 2음 2", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 3.6274, "dur": 0.4669},
  {"id": "b:dg_tone1", "name": "전자음 삐", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.2, "sprite": "pack_digital", "start": 4.6943, "dur": 0.2029},
  {"id": "b:dg_lowthreetone", "name": "낮은 전자 3음", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.9, "sprite": "pack_digital", "start": 5.4972, "dur": 0.9326},
  {"id": "b:dg_zapthreetoneup", "name": "올라가는 신호", "cat": "digital", "desc": "전자음 · Kenney", "sec": 1.1, "sprite": "pack_digital", "start": 7.0298, "dur": 1.1238},
  {"id": "b:dg_zapthreetonedown", "name": "내려가는 신호", "cat": "digital", "desc": "전자음 · Kenney", "sec": 1.3, "sprite": "pack_digital", "start": 8.7537, "dur": 1.2817},
  {"id": "b:dg_zaptwotone", "name": "신호 두 번", "cat": "digital", "desc": "전자음 · Kenney", "sec": 1.3, "sprite": "pack_digital", "start": 10.6353, "dur": 1.2577},
  {"id": "b:dg_powerup1", "name": "파워업 1", "cat": "digital", "desc": "전자음 · Kenney", "sec": 1.0, "sprite": "pack_digital", "start": 12.493, "dur": 1.0253},
  {"id": "b:dg_powerup3", "name": "파워업 2", "cat": "digital", "desc": "전자음 · Kenney", "sec": 1.0, "sprite": "pack_digital", "start": 14.1183, "dur": 0.9568},
  {"id": "b:dg_powerup12", "name": "파워업 3", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.7, "sprite": "pack_digital", "start": 15.6751, "dur": 0.7035},
  {"id": "b:dg_phaserup1", "name": "레이저 올라가기", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 16.9786, "dur": 0.4767},
  {"id": "b:dg_highup", "name": "높은 신호", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 18.0553, "dur": 0.4977},
  {"id": "b:dg_confirmation_002", "name": "확인음 1", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 19.153, "dur": 0.539},
  {"id": "b:dg_confirmation_004", "name": "확인음 2", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 20.292, "dur": 0.4904},
  {"id": "b:dg_question_001", "name": "물음 알림", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 21.3824, "dur": 0.4907},
  {"id": "b:dg_glass_004", "name": "유리 땡", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.7, "sprite": "pack_digital", "start": 22.4731, "dur": 0.6923},
  {"id": "b:dg_select_006", "name": "선택음 길게", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.3, "sprite": "pack_digital", "start": 23.7653, "dur": 0.2719},
  {"id": "b:dg_switch_001", "name": "스위치", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.2, "sprite": "pack_digital", "start": 24.6372, "dur": 0.1867},
  {"id": "b:dg_maximize_005", "name": "펼침음", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.5, "sprite": "pack_digital", "start": 25.4239, "dur": 0.5253},
  {"id": "b:dg_error_005", "name": "오류음 1", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.2, "sprite": "pack_digital", "start": 26.5492, "dur": 0.2387},
  {"id": "b:dg_error_006", "name": "오류음 2", "cat": "digital", "desc": "전자음 · Kenney", "sec": 0.3, "sprite": "pack_digital", "start": 27.3879, "dur": 0.2918},
  {"id": "b:bgm_jrpg_piano", "name": "옛날 게임 피아노", "cat": "bgm", "mood": "piano", "desc": "잔잔한 피아노 · Joth", "sec": 24.9, "file": "bgm/jrpg_piano.mp3", "stream": true, "author": "Joth"},
  {"id": "b:bgm_soft_piano", "name": "부드러운 피아노", "cat": "bgm", "mood": "piano", "desc": "잔잔한 피아노 · Tozan", "sec": 180, "file": "bgm/soft_piano.mp3", "stream": true, "author": "Tozan"},
  {"id": "b:bgm_calm_piano", "name": "잔잔한 피아노", "cat": "bgm", "mood": "piano", "desc": "잔잔한 피아노 · cynicmusic", "sec": 165.0, "file": "bgm/calm_piano.mp3", "stream": true, "author": "cynicmusic"},
  {"id": "b:bgm_happy_lullaby", "name": "행복한 자장가", "cat": "bgm", "mood": "piano", "desc": "잔잔한 피아노 · cynicmusic", "sec": 39.6, "file": "bgm/happy_lullaby.mp3", "stream": true, "author": "cynicmusic"},
  {"id": "b:bgm_calm_loop", "name": "잔잔한 반복", "cat": "bgm", "mood": "piano", "desc": "잔잔한 피아노 · wipics", "sec": 19.4, "file": "bgm/calm_loop.mp3", "stream": true, "author": "wipics"},
  {"id": "b:bgm_morning_sky", "name": "아침 하늘", "cat": "bgm", "mood": "morning", "desc": "아침·밝게 · Centurion_of_war", "sec": 132.0, "file": "bgm/morning_sky.mp3", "stream": true, "author": "Centurion_of_war"},
  {"id": "b:bgm_pure_morning", "name": "맑은 아침", "cat": "bgm", "mood": "morning", "desc": "아침·밝게 · haruta", "sec": 102.0, "file": "bgm/pure_morning.mp3", "stream": true, "author": "haruta"},
  {"id": "b:bgm_good_morning", "name": "굿모닝", "cat": "bgm", "mood": "morning", "desc": "아침·밝게 · Cakeflaps", "sec": 121.1, "file": "bgm/good_morning.mp3", "stream": true, "author": "Cakeflaps"},
  {"id": "b:bgm_sunflower", "name": "해바라기 들판", "cat": "bgm", "mood": "morning", "desc": "아침·밝게 · Komiku", "sec": 118.0, "file": "bgm/sunflower.mp3", "stream": true, "author": "Komiku"},
  {"id": "b:bgm_ladada_guitar", "name": "라다다 기타", "cat": "bgm", "mood": "morning", "desc": "아침·밝게 · Pro Sensory", "sec": 153.7, "file": "bgm/ladada_guitar.mp3", "stream": true, "author": "Pro Sensory"},
  {"id": "b:bgm_lofi_tea", "name": "차 한 잔", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 168.8, "file": "bgm/lofi_tea.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_lofi_cat", "name": "고양이 카페", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 133.0, "file": "bgm/lofi_cat.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_lofi_rainy", "name": "비 오는 숲", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 99.6, "file": "bgm/lofi_rainy.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_lofi_country", "name": "시골 풍경", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 92.2, "file": "bgm/lofi_country.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_lofi_ocean", "name": "바닷가", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 102.6, "file": "bgm/lofi_ocean.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_lofi_florist", "name": "꽃집", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 113.0, "file": "bgm/lofi_florist.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_lofi_rain", "name": "아침 비", "cat": "bgm", "mood": "lofi", "desc": "로파이 · TAD", "sec": 64.1, "file": "bgm/lofi_rain.mp3", "stream": true, "author": "TAD"},
  {"id": "b:bgm_sunset_plains", "name": "노을 들판", "cat": "bgm", "mood": "nature", "desc": "자연·오케스트라 · Yoiyami", "sec": 180, "file": "bgm/sunset_plains.mp3", "stream": true, "author": "Yoiyami"},
  {"id": "b:bgm_peaceful_forest", "name": "평화로운 숲", "cat": "bgm", "mood": "nature", "desc": "자연·오케스트라 · Samza", "sec": 63.1, "file": "bgm/peaceful_forest.mp3", "stream": true, "author": "Samza"},
  {"id": "b:bgm_at_home", "name": "집에서 (오케스트라)", "cat": "bgm", "mood": "nature", "desc": "자연·오케스트라 · Wolfgang_", "sec": 74.3, "file": "bgm/at_home.mp3", "stream": true, "author": "Wolfgang_"},
  {"id": "b:bgm_beautiful_forest", "name": "아름다운 숲 (오케스트라)", "cat": "bgm", "mood": "nature", "desc": "자연·오케스트라 · nene", "sec": 70.0, "file": "bgm/beautiful_forest.mp3", "stream": true, "author": "nene"},
  {"id": "b:bgm_forest_birds", "name": "숲 속 새소리", "cat": "bgm", "mood": "nature", "desc": "자연·오케스트라 · TinyWorlds", "sec": 44.8, "file": "bgm/forest_birds.mp3", "stream": true, "author": "TinyWorlds"},
  {"id": "b:bgm_cloud_nap", "name": "구름 위 낮잠", "cat": "bgm", "mood": "game", "desc": "신나게 · congusbongus", "sec": 180, "file": "bgm/cloud_nap.mp3", "stream": true, "author": "congusbongus"},
  {"id": "b:bgm_happy_adventure", "name": "신나는 모험", "cat": "bgm", "mood": "game", "desc": "신나게 · TinyWorlds", "sec": 46.8, "file": "bgm/happy_adventure.mp3", "stream": true, "author": "TinyWorlds"},
  {"id": "b:bgm_flowerbed", "name": "꽃밭 들판", "cat": "bgm", "mood": "game", "desc": "신나게 · Zane Little Music", "sec": 105.9, "file": "bgm/flowerbed.mp3", "stream": true, "author": "Zane Little Music"},
  {"id": "b:bgm_apple_cider", "name": "사과 사이다", "cat": "bgm", "mood": "game", "desc": "신나게 · Zane Little Music", "sec": 180, "file": "bgm/apple_cider.mp3", "stream": true, "author": "Zane Little Music"},
  {"id": "b:bgm_bossa8", "name": "8비트 보사노바", "cat": "bgm", "mood": "game", "desc": "신나게 · Joth", "sec": 59.6, "file": "bgm/bossa8.mp3", "stream": true, "author": "Joth"},
  {"id": "b:bgm_summer_sunday", "name": "여름 일요일", "cat": "bgm", "mood": "game", "desc": "신나게 · celestialghost8", "sec": 64.2, "file": "bgm/summer_sunday.mp3", "stream": true, "author": "celestialghost8"}
);

// 예전 이름 → 새 이름
const ALIAS = { 'b:marimba': 'b:glock_up', 'b:alarm': 'b:siren' };
export function resolveBuiltin(id) { return ALIAS[id] || id; }
export function isBuiltin(id) { return typeof id === 'string' && id.startsWith('b:'); }
export function builtinInfo(id) { return BUILTIN_SOUNDS.find(x => x.id === resolveBuiltin(id)); }
export function builtinName(id) { const s = builtinInfo(id); return s ? s.name : '기본 종'; }
export function builtinUrl(id) {
  const s = builtinInfo(id) || BUILTIN_SOUNDS[0];
  const rel = s.file ? s.file : (s.sprite ? `sounds/${s.sprite}.mp3` : `sounds/${s.id.slice(2)}.mp3`);
  return new URL(rel, document.baseURI).href;
}
export function isStream(id) { const s = builtinInfo(id); return !!(s && s.stream); }

let ctx = null;
let master = null;
let analyserNode = null;
export function getAnalyser() { return analyserNode; }
export function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createDynamicsCompressor();
    // 화면의 실시간 주파수 막대(RTA)용 분석기: 모든 소리가 여기를 지나가요
    try {
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 8192;
      analyserNode.smoothingTimeConstant = 0.55;
      master.connect(analyserNode);
      analyserNode.connect(ctx.destination);
    } catch (e) { analyserNode = null; master.connect(ctx.destination); }
  }
  return ctx;
}

// ── 기본 종소리 (미리 풀어 둔 소리 데이터로 정확하게 재생) ──────────
const bufCache = new Map();
function decode(ab) {
  return new Promise((res, rej) => {
    try {
      const p = audioCtx().decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    } catch (e) { rej(e); }
  });
}
export function loadBuiltin(id) {
  const key = builtinUrl(resolveBuiltin(id));   // 묶음 파일은 한 번만 풀어서 같이 씀
  if (!bufCache.has(key)) {
    const p = fetch(key).then(r => { if (!r.ok) throw new Error('sound ' + r.status); return r.arrayBuffer(); }).then(decode);
    p.catch(() => bufCache.delete(key));
    bufCache.set(key, p);
  }
  return bufCache.get(key);
}
export function preloadBuiltins(ids) {
  for (const id of ids) {
    if (!isBuiltin(id)) continue;
    if (isStream(id)) preloadUrl(builtinUrl(id));
    else loadBuiltin(id).catch(() => {});
  }
}

async function playBuiltin(id, volume = 100, maxSec = 0) {
  const info = builtinInfo(id) || {};
  if (info.stream) return playUrl(builtinUrl(id), volume, maxSec);   // 배경음악은 길어서 바로 흘려 재생
  const c = audioCtx();
  if (c.state === 'suspended') { try { await c.resume(); } catch (e) { /* 무시 */ } }
  let buffer;
  try { buffer = await loadBuiltin(id); } catch (e) {
    // 파일이 서버에 없으면(아직 안 올라감) 기본 종으로 대신 울림 — 조용히 넘어가지 않게
    if (/sound 404/.test(String(e && e.message)) && resolveBuiltin(id) !== 'b:westminster') {
      try { window.dispatchEvent(new CustomEvent('bk-sound-missing', { detail: { id, url: builtinUrl(id) } })); } catch (err) { /* 무시 */ }
      return playBuiltin('b:westminster', volume, maxSec);
    }
    // 소리 데이터를 못 풀면 파일을 그대로 재생
    return playUrl(builtinUrl(id), volume, maxSec, info.sprite ? info.start : 0, info.sprite ? info.dur : 0);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  const v = Math.max(0, Math.min(1, volume / 100));
  g.gain.value = v;
  src.connect(g); g.connect(master);
  const t0 = c.currentTime + 0.02;
  let dur = buffer.duration;
  if (info.sprite) { src.start(t0, info.start, info.dur + 0.05); dur = info.dur; }
  else src.start(t0);
  if (maxSec > 0 && maxSec < dur) {
    const fade = Math.min(2, maxSec / 3);
    g.gain.setValueAtTime(v, t0 + maxSec - fade);
    g.gain.linearRampToValueAtTime(0.0001, t0 + maxSec);
    src.stop(t0 + maxSec + 0.05);
    dur = maxSec;
  }
  let resolveEnd;
  const finished = new Promise(r => { resolveEnd = r; });
  src.onended = () => resolveEnd();
  setTimeout(resolveEnd, (dur + 0.5) * 1000);
  return {
    finished,
    stop() {
      try { g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(0.0001, c.currentTime, 0.08); src.stop(c.currentTime + 0.4); } catch (e) { /* 무시 */ }
      setTimeout(resolveEnd, 450);
    }
  };
}

// ── 오디오 파일 ─────────────────────────────────────
const pool = new Map(); // url → HTMLAudioElement

// 같은 주소(우리 사이트)의 파일, 또는 CORS가 열린 저장소 파일만 분석기에 연결할 수 있어요
function sameOrigin(url) { try { return new URL(url, location.href).origin === location.origin; } catch (e) { return false; } }
function corsOk(url) { try { return localStorage.getItem('bk.cors.' + new URL(url).origin) === '1'; } catch (e) { return false; } }
export async function probeCors(url) {
  // 올린 소리 하나로 저장소 CORS가 열렸는지 한 번 확인 (열려 있으면 안내 음성도 RTA에 보임)
  try {
    const o = new URL(url).origin;
    if (o === location.origin) return;
    const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
    localStorage.setItem('bk.cors.' + o, r.ok ? '1' : '0');
  } catch (e) { try { localStorage.setItem('bk.cors.' + new URL(url).origin, '0'); } catch (err) { /* 무시 */ } }
}
const routed = new WeakMap();
function routeToAnalyser(a, url) {
  try {
    if (!ctx || routed.has(a)) return;
    if (!sameOrigin(url) && !a.crossOrigin) return;
    if (ctx.state !== 'running') return;
    const src = ctx.createMediaElementSource(a);
    src.connect(master);
    routed.set(a, src);
  } catch (e) { /* 무시 — 그냥 소리만 남 */ }
}
export function preloadUrl(url) {
  if (!url) return null;
  let a = pool.get(url);
  if (!a) {
    a = new Audio();
    if (!sameOrigin(url) && corsOk(url)) a.crossOrigin = 'anonymous';
    a.preload = 'auto';
    a.src = url;
    try { a.load(); } catch (e) { /* 무시 */ }
    pool.set(url, a);
  }
  return a;
}
export function forgetUnused(keepUrls) {
  for (const [url, a] of pool) if (!keepUrls.has(url)) { try { a.pause(); a.src = ''; } catch (e) { /* 무시 */ } pool.delete(url); }
}

function playUrl(url, volume = 100, maxSec = 0, startAt = 0, clipDur = 0, opts = {}) {
  const a = preloadUrl(url);
  if (ctx && routed.has(a) && ctx.state !== 'running') { try { ctx.resume(); } catch (e) { /* 무시 */ } }
  routeToAnalyser(a, url);
  const base = Math.max(0, Math.min(1, volume / 100));
  if (clipDur > 0 && !maxSec) maxSec = clipDur + 0.3;
  let fadeTimer = null, stopTimer = null, stepTimer = null;
  let resolveEnd;
  const finished = new Promise(r => { resolveEnd = r; });
  const end = () => { clearTimeout(fadeTimer); clearTimeout(stopTimer); clearInterval(stepTimer); resolveEnd(); };
  a.onended = end;
  a.onerror = () => {
    // CORS 설정이 사라진 경우: 분석기 연결 없이 다시 재생
    if (a.crossOrigin && !opts._retry) {
      try { localStorage.setItem('bk.cors.' + new URL(url).origin, '0'); } catch (e) { /* 무시 */ }
      pool.delete(url);
      const r = playUrl(url, volume, maxSec, startAt, clipDur, { ...opts, _retry: true });
      r.finished.then(end);
      return;
    }
    end();
  };
  a.loop = !!opts.loop;
  a.volume = opts.fadeIn ? 0.001 : base;
  try { a.currentTime = startAt || 0; } catch (e) { /* 무시 */ }
  const p = a.play();
  if (p && p.catch) p.catch(end);
  if (opts.fadeIn) {
    let v = 0.001;
    const step = base / (opts.fadeIn * 10);
    const fi = setInterval(() => { v += step; if (v >= base) { v = base; clearInterval(fi); } try { a.volume = v; } catch (e) { clearInterval(fi); } }, 100);
  }
  const fadeOut = () => {
    let v = a.volume;
    clearInterval(stepTimer);
    stepTimer = setInterval(() => {
      v -= base / 20;
      if (v <= 0.01) { clearInterval(stepTimer); a.pause(); end(); } else a.volume = v;
    }, 100);
  };
  if (maxSec > 0) {
    fadeTimer = setTimeout(fadeOut, Math.max(0, maxSec - 2) * 1000);
    stopTimer = setTimeout(() => { a.pause(); end(); }, (maxSec + 1) * 1000);
  }
  return { finished, stop() { fadeOut(); } };
}

// ── 기기 음성 (설정 없이 무료) ─────────────────────────
const LS_VOICE = 'bk.voice';
const LS_RATE = 'bk.voiceRate';
export function deviceVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter(v => /^ko/i.test(v.lang));
}
export function getDeviceVoicePref() {
  try { return { uri: localStorage.getItem(LS_VOICE) || '', rate: Number(localStorage.getItem(LS_RATE)) || 1 }; } catch (e) { return { uri: '', rate: 1 }; }
}
export function setDeviceVoicePref(uri, rate) {
  try { localStorage.setItem(LS_VOICE, uri || ''); localStorage.setItem(LS_RATE, String(rate || 1)); } catch (e) { /* 무시 */ }
}
let speaking = false;
export function isSpeaking() { return speaking; }
export function speak(text, volume = 100, opts = {}) {
  return new Promise(resolve => {
    if (!text || !('speechSynthesis' in window)) return resolve();
    try {
      const pref = getDeviceVoicePref();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.rate = opts.rate || pref.rate || 1;
      u.volume = Math.max(0, Math.min(1, volume / 100));
      const vs = deviceVoices();
      const v = vs.find(x => x.voiceURI === (opts.uri || pref.uri)) || vs[0];
      if (v) u.voice = v;
      speaking = true;
      const done = () => { speaking = false; resolve(); };
      u.onend = done; u.onerror = done;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      setTimeout(() => { speaking = false; resolve(); }, 30000);
    } catch (e) { speaking = false; resolve(); }
  });
}

// 브라우저가 소리를 낼 수 있도록 사용자가 누를 때 한 번 호출
export async function unlockAudio() {
  const c = audioCtx();
  try { await c.resume(); } catch (e) { /* 무시 */ }
  try {
    const b = c.createBuffer(1, 1, 22050);
    const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0);
  } catch (e) { /* 무시 */ }
  for (const a of pool.values()) {
    try { a.muted = true; await a.play(); a.pause(); a.currentTime = 0; } catch (e) { /* 무시 */ } finally { a.muted = false; }
  }
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { /* 무시 */ } }
  return c.state === 'running';
}
export function audioReady() { return !!ctx && ctx.state === 'running'; }

// ── 종 하나 재생 (소리 + 안내) ─────────────────────────
let current = null;
let playingCount = 0;
export function isPlaying() { return playingCount > 0; }
function emitPlay(on, label) { try { window.dispatchEvent(new CustomEvent('bk-play', { detail: { on, label } })); } catch (e) { /* 무시 */ } }
let bgCurrent = null;
const wait = ms => new Promise(r => setTimeout(r, ms));

// bell: { soundId, volume, maxSec, repeat, say, sayId, sayRepeat, bgmId, bgmVol }
// soundsById: { [id]: { url } } — 올린 소리·만든 안내 음성
export function playBell(bell, soundsById = {}) {
  if (current) current.stop();
  const volume = bell.volume == null ? 100 : bell.volume;
  let stopped = false;
  let inner = null;
  const run = (async () => {
    const id = bell.soundId || 'b:westminster';
    const times = Math.max(1, Math.min(5, Math.round(Number(bell.repeat)) || 1));   // 종소리 반복 (1~5번)
    if (id !== 'none') {
      for (let r = 0; r < times; r++) {
        if (isBuiltin(id)) inner = await playBuiltin(id, volume, bell.maxSec || 0);
        else if (soundsById[id] && soundsById[id].url) inner = playUrl(soundsById[id].url, volume, bell.maxSec || 0);
        else inner = await playBuiltin('b:westminster', volume);   // 파일을 찾을 수 없으면 기본 종으로
        if (stopped) inner.stop();
        await inner.finished;
        if (stopped) return;
        if (r < times - 1) await wait(350);
      }
    }
    if (stopped) return;
    const tts = bell.sayId && soundsById[bell.sayId];
    if (!(tts && tts.url) && !bell.say) return;
    // 안내 방송 + 배경음악: 배경음악을 작게 깔고 → 안내 → 잠시 뒤 배경음악이 서서히 끝남
    let bg = null;
    const bgUrl = bell.bgmId ? (isBuiltin(bell.bgmId) ? builtinUrl(bell.bgmId) : (soundsById[bell.bgmId] || {}).url) : '';
    if (bgUrl) {
      bg = playUrl(bgUrl, bell.bgmVol == null ? 30 : bell.bgmVol, 0, 0, 0, { fadeIn: 1.2, loop: true });
      bgCurrent = bg;
      await wait(1600);
      if (stopped) { bg.stop(); return; }
    }
    const sayTimes = Math.max(1, Math.min(3, Math.round(Number(bell.sayRepeat)) || 1));   // 안내 반복 (1~3번)
    for (let r = 0; r < sayTimes && !stopped; r++) {
      if (r > 0) await wait(900);
      if (stopped) break;
      if (tts && tts.url) {
        inner = playUrl(tts.url, Math.min(100, volume + 10));
        await inner.finished;
      } else {
        await speak(bell.say, volume);
      }
    }
    if (bg) {
      if (!stopped) await wait(1800);
      bg.stop();
      await bg.finished;
    }
  })();
  const ctl = {
    finished: run,
    stop() {
      stopped = true;
      if (inner) inner.stop();
      if (bgCurrent) { try { bgCurrent.stop(); } catch (e) { /* 무시 */ } bgCurrent = null; }
      if ('speechSynthesis' in window) { try { speechSynthesis.cancel(); } catch (e) { /* 무시 */ } }
    }
  };
  current = ctl;
  playingCount++;
  emitPlay(true, bell.label || '');
  run.finally(() => {
    if (current === ctl) current = null;
    playingCount = Math.max(0, playingCount - 1);
    if (!playingCount) emitPlay(false, '');
  });
  return ctl;
}
export function stopAll() { if (current) current.stop(); }

// 업로드 전에 파일 길이 알아내기
export function fileDuration(file) {
  return new Promise(resolve => {
    const a = new Audio();
    let url = '';
    try { url = URL.createObjectURL(file); } catch (e) { return resolve(0); }
    a.preload = 'metadata';
    a.onloadedmetadata = () => { const d = a.duration; URL.revokeObjectURL(url); resolve(Number.isFinite(d) ? d : 0); };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    a.src = url;
  });
}
