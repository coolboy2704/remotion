export const FPS = 25;
export const VIDEO_FRAMES = 1168; // 46.72s
export const OUTRO_FRAMES = 85;
export const TOTAL_FRAMES = VIDEO_FRAMES + OUTRO_FRAMES;

export type Answer = 'yes' | 'no' | null;

export type QA = {
	q: string;
	a: string;
	qStart: number; // seconds
	qEnd: number;
	aStart: number;
	aEnd: number;
	answer: Answer;
	qIcons: string[];
	keywords: string[];
};

// Speech segments measured with ffmpeg silencedetect on the source audio.
export const QAS: QA[] = [
	{
		q: 'Balalar massaji bópeniń buwinlarin rawajlandırıw menen bir qatarda ishi qatıwın da jeńillestiriwi raspa?',
		a: 'Awa, kópshilik hallarda járdem beredi.',
		qStart: 0.0,
		qEnd: 5.62,
		aStart: 6.02,
		aEnd: 8.22,
		answer: 'yes',
		qIcons: ['baby', 'bone'],
		keywords: ['járdem'],
	},
	{
		q: 'Bala awqatlanıp bolǵannan keyin qansha waqıt ótip massaj islew kerek?',
		a: 'Keminde 30 minut ótkennen massaj islewge boladi.',
		qStart: 8.8,
		qEnd: 12.07,
		aStart: 12.68,
		aEnd: 15.85,
		answer: null,
		qIcons: ['bottle', 'clock'],
		keywords: ['30', 'minut'],
	},
	{
		q: 'Massaj balanıń uyqısın jaqsılawǵa da járdem berema?',
		a: 'Awa, kópshilik hallarda massaj alatuǵın balanıń uyqısı tınıshlanadi hám sebepsiz jılay bermeydi.',
		qStart: 16.49,
		qEnd: 18.88,
		aStart: 19.3,
		aEnd: 25.31,
		answer: 'yes',
		qIcons: ['sleeping', 'moon'],
		keywords: ['uyqısı', 'tınıshlanadi'],
	},
	{
		q: 'Bala massaj alıp atırǵan waqtında jılasa da massajdı dawam ettire bersek bolama?',
		a: 'Yaq, bala massaj waqtında biytaqatlanip jilay beretuǵın bolsa, massajdi toqtatıp keyinirekke qaldırıw kerek.',
		qStart: 25.77,
		qEnd: 29.72,
		aStart: 30.3,
		aEnd: 36.78,
		answer: 'no',
		qIcons: ['crying', 'question'],
		keywords: ['toqtatıp', 'keyinirekke'],
	},
	{
		q: 'Hámme bala ushın birdey massaj texnikasınan paydalanıladıma?',
		a: 'Yaq, hár bir balanıń jaǵdayınan kelip shıǵıp hár túrli texnikalar menen emleymiz',
		qStart: 37.37,
		qEnd: 40.82,
		aStart: 41.46,
		aEnd: 46.3,
		answer: 'no',
		qIcons: ['palms', 'question'],
		keywords: ['hár', 'túrli', 'texnikalar'],
	},
];

export type TimedWord = {text: string; start: number; end: number};

// Spread words across a speech segment proportionally to their length.
export const timeWords = (text: string, start: number, end: number): TimedWord[] => {
	const words = text.split(/\s+/).filter(Boolean);
	const weights = words.map((w) => w.length + 2);
	const total = weights.reduce((a, b) => a + b, 0);
	let t = start;
	return words.map((w, i) => {
		const d = ((end - start) * weights[i]) / total;
		const out = {text: w, start: t, end: t + d};
		t += d;
		return out;
	});
};

// Group timed words into short subtitle chunks.
export const chunkWords = (words: TimedWord[], maxChars: number): TimedWord[][] => {
	const chunks: TimedWord[][] = [];
	let cur: TimedWord[] = [];
	let len = 0;
	for (const w of words) {
		if (cur.length > 0 && len + w.text.length + 1 > maxChars) {
			chunks.push(cur);
			cur = [];
			len = 0;
		}
		cur.push(w);
		len += w.text.length + 1;
		if (/[,.?]$/.test(w.text) && len > maxChars * 0.45) {
			chunks.push(cur);
			cur = [];
			len = 0;
		}
	}
	if (cur.length) chunks.push(cur);
	return chunks;
};
