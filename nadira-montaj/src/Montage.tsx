import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Freeze,
	Img,
	OffthreadVideo,
	Sequence,
	continueRender,
	delayRender,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import {GRADE_FILTER, GradeDefs, VIGNETTE} from './grade';
import {
	FPS,
	OUTRO_FRAMES,
	QAS,
	QA,
	TimedWord,
	VIDEO_FRAMES,
	chunkWords,
	timeWords,
} from './data';

const FONT = 'Mont';
const PLUM = '#2B1630';
const CORAL = '#F0506E';
const GREEN = '#1FAF7A';
const GOLD = '#FFD34D';

const fontHandle = delayRender('Loading fonts');
Promise.all(
	[600, 800, 900].map((w) =>
		new FontFace(FONT, `url(${staticFile(`fonts/Montserrat-${w}.ttf`)})`, {
			weight: String(w),
		})
			.load()
			.then((f) => document.fonts.add(f)),
	),
).then(() => continueRender(fontHandle));

const sec = (s: number) => Math.round(s * FPS);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const nextQStart = (i: number) =>
	i + 1 < QAS.length ? QAS[i + 1].qStart : VIDEO_FRAMES / FPS;

const Icon: React.FC<{
	name: string;
	size: number;
	x: number;
	y: number;
	delay: number;
	rotate?: number;
	bob?: number;
}> = ({name, size, x, y, delay, rotate = 0, bob = 1}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: frame - delay, fps, config: {damping: 9, stiffness: 140}});
	const float = Math.sin((frame + delay * 7) / 14) * 10 * bob;
	const wobble = Math.sin((frame + delay * 5) / 18) * 6 * bob;
	return (
		<Img
			src={staticFile(`icons/${name}.webp`)}
			style={{
				position: 'absolute',
				left: x - size / 2,
				top: y - size / 2,
				width: size,
				height: size,
				transform: `translateY(${float}px) scale(${s}) rotate(${rotate + wobble + (1 - s) * -40}deg)`,
				filter: 'drop-shadow(0 18px 22px rgba(43,22,48,0.35))',
			}}
		/>
	);
};

// Exit animation shared by overlays: returns [opacity, translateY]
const useExit = (durationFrames: number, len = 8) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [durationFrames - len, durationFrames], [0, 1], clamp);
	return {opacity: 1 - p, dy: -60 * Easing.in(Easing.cubic)(p)};
};

const QuestionCard: React.FC<{qa: QA; index: number; duration: number; offset: number}> = ({
	qa,
	index,
	duration,
	offset,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = (frame + offset) / fps;
	const enter = spring({frame, fps, config: {damping: 14, stiffness: 120}});
	const {opacity, dy} = useExit(duration);
	const words = timeWords(qa.q, qa.qStart, qa.qEnd);
	return (
		<AbsoluteFill style={{opacity}}>
			<div
				style={{
					position: 'absolute',
					left: 54,
					right: 54,
					top: 185,
					transform: `translateY(${(1 - enter) * -140 + dy}px) scale(${0.9 + 0.1 * enter})`,
					opacity: enter,
					background: 'rgba(255,255,255,0.96)',
					borderRadius: 44,
					padding: '70px 48px 44px',
					boxShadow: '0 30px 70px rgba(43,22,48,0.28)',
					borderLeft: `14px solid ${CORAL}`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: -30,
						left: 40,
						background: CORAL,
						color: 'white',
						fontFamily: FONT,
						fontWeight: 900,
						fontSize: 34,
						letterSpacing: 3,
						padding: '12px 30px',
						borderRadius: 999,
						boxShadow: '0 10px 24px rgba(240,80,110,0.45)',
					}}
				>
					SORAW {index + 1}/{QAS.length}
				</div>
				<div
					style={{
						fontFamily: FONT,
						fontWeight: 800,
						fontSize: 47,
						lineHeight: 1.2,
						color: PLUM,
					}}
				>
					{words.map((w, i) => {
						const appear = interpolate(frame, [2 + i * 1.2, 8 + i * 1.2], [0, 1], clamp);
						const spoken = t >= w.start;
						return (
							<span
								key={i}
								style={{
									display: 'inline-block',
									marginRight: 12,
									opacity: appear,
									transform: `translateY(${(1 - appear) * 24}px)`,
									color: spoken ? PLUM : 'rgba(43,22,48,0.32)',
								}}
							>
								{w.text}
							</span>
						);
					})}
				</div>
			</div>
			<Icon name={qa.qIcons[0]} size={190} x={930} y={185} delay={8} rotate={10} />
			<Icon name={qa.qIcons[1]} size={120} x={800} y={150} delay={13} rotate={-12} />
		</AbsoluteFill>
	);
};

const Subtitles: React.FC<{words: TimedWord[]; offset: number; keywords: string[]}> = ({
	words,
	offset,
	keywords,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = (frame + offset) / fps;
	const chunks = chunkWords(words, 22);
	const idx = chunks.findIndex(
		(c, i) => t < (i + 1 < chunks.length ? chunks[i + 1][0].start : Infinity),
	);
	const chunk = chunks[idx];
	if (!chunk || t < chunk[0].start - 0.15) return null;
	const local = frame - sec(chunk[0].start - offset / fps) + 4;
	const pop = spring({frame: local, fps, config: {damping: 12, stiffness: 200}});
	return (
		<div
			style={{
				position: 'absolute',
				left: 50,
				right: 50,
				top: 1610,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				transform: `scale(${0.85 + 0.15 * pop}) translateY(${(1 - pop) * 30}px)`,
				opacity: pop,
			}}
		>
			{chunk.map((w, i) => {
				const active = t >= w.start && t < w.end + 0.05;
				const key = keywords.some((k) => w.text.toLowerCase().startsWith(k.toLowerCase()));
				return (
					<span
						key={i}
						style={{
							fontFamily: FONT,
							fontWeight: 900,
							fontSize: 70,
							lineHeight: 1.3,
							margin: '0 8px',
							padding: '0 14px',
							borderRadius: 18,
							color: key && !active ? GOLD : 'white',
							background: active ? CORAL : 'transparent',
							transform: `scale(${active ? 1.08 : 1})`,
							WebkitTextStroke: active ? '0px' : '12px rgba(20,8,24,0.9)',
							paintOrder: 'stroke fill',
							textShadow: '0 6px 18px rgba(0,0,0,0.45)',
						}}
					>
						{w.text}
					</span>
				);
			})}
		</div>
	);
};

const AnswerBadge: React.FC<{answer: 'yes' | 'no'; duration: number}> = ({answer, duration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = spring({frame: frame - 3, fps, config: {damping: 8, stiffness: 160}});
	const {opacity, dy} = useExit(duration);
	const yes = answer === 'yes';
	const color = yes ? GREEN : CORAL;
	const draw = interpolate(frame, [8, 18], [0, 1], clamp);
	return (
		<div
			style={{
				position: 'absolute',
				top: 255,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity,
				transform: `translateY(${dy + Math.sin(frame / 12) * 6}px) scale(${s})`,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 26,
					background: 'white',
					borderRadius: 999,
					padding: '18px 56px 18px 20px',
					boxShadow: `0 24px 60px ${yes ? 'rgba(31,175,122,0.45)' : 'rgba(240,80,110,0.45)'}`,
				}}
			>
				<svg width={110} height={110} viewBox="0 0 110 110">
					<circle cx={55} cy={55} r={55} fill={color} />
					{yes ? (
						<path
							d="M30 57 L48 74 L81 38"
							stroke="white"
							strokeWidth={12}
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeDasharray={80}
							strokeDashoffset={80 * (1 - draw)}
						/>
					) : (
						<path
							d="M36 36 L74 74 M74 36 L36 74"
							stroke="white"
							strokeWidth={12}
							fill="none"
							strokeLinecap="round"
							strokeDasharray={110}
							strokeDashoffset={110 * (1 - draw)}
						/>
					)}
				</svg>
				<div style={{fontFamily: FONT, fontWeight: 900, fontSize: 92, color, letterSpacing: 4}}>
					{yes ? 'AWA' : 'YAQ'}
				</div>
			</div>
		</div>
	);
};

const MinuteCounter: React.FC<{startFrame: number; duration: number}> = ({startFrame, duration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const f = frame - startFrame;
	const s = spring({frame: f, fps, config: {damping: 10, stiffness: 140}});
	const progress = interpolate(f, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const {opacity, dy} = useExit(duration);
	const r = 120;
	const circ = 2 * Math.PI * r;
	return (
		<div
			style={{
				position: 'absolute',
				top: 150,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity: opacity * Math.min(1, s * 1.5),
				transform: `translateY(${dy}px) scale(${s})`,
			}}
		>
			<div style={{position: 'relative', width: 300, height: 300}}>
				<svg width={300} height={300} style={{position: 'absolute'}}>
					<circle cx={150} cy={150} r={140} fill="white" />
					<circle cx={150} cy={150} r={r} fill="none" stroke="#F3E3E8" strokeWidth={18} />
					<circle
						cx={150}
						cy={150}
						r={r}
						fill="none"
						stroke={CORAL}
						strokeWidth={18}
						strokeLinecap="round"
						strokeDasharray={circ}
						strokeDashoffset={circ * (1 - progress)}
						transform="rotate(-90 150 150)"
					/>
				</svg>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						fontFamily: FONT,
						color: PLUM,
					}}
				>
					<div style={{fontWeight: 900, fontSize: 120, lineHeight: 1}}>{Math.round(30 * progress)}</div>
					<div style={{fontWeight: 800, fontSize: 36, letterSpacing: 6, color: CORAL}}>MINUT</div>
				</div>
				<div style={{position: 'absolute', inset: 0}}>
					<Icon name="stopwatch" size={130} x={290} y={30} delay={startFrame + 6} rotate={14} />
					<Icon name="bottle" size={110} x={10} y={250} delay={startFrame + 10} rotate={-16} />
				</div>
			</div>
		</div>
	);
};

const AnswerSection: React.FC<{qa: QA; index: number; duration: number; offset: number}> = ({
	qa,
	index,
	duration,
	offset,
}) => {
	const words = timeWords(qa.a, qa.aStart, qa.aEnd);
	const at = (word: string) => {
		const w = words.find((x) => x.text.toLowerCase().startsWith(word));
		return w ? sec(w.start) - offset : 0;
	};
	const {opacity} = useExit(duration);
	return (
		<AbsoluteFill>
			{qa.answer ? <AnswerBadge answer={qa.answer} duration={duration} /> : null}
			<AbsoluteFill style={{opacity}}>
				{index === 0 ? (
					<>
						<Icon name="sparkles" size={120} x={190} y={280} delay={10} />
						<Icon name="heart" size={130} x={900} y={420} delay={16} rotate={12} />
					</>
				) : null}
				{index === 1 ? <MinuteCounter startFrame={Math.max(0, at('30') - 4)} duration={duration} /> : null}
				{index === 2 ? (
					<>
						<Icon name="moon" size={170} x={170} y={470} delay={at('uyq')} rotate={-10} />
						<Icon name="zzz" size={130} x={910} y={470} delay={at('uyq') + 6} />
						<Icon name="sleeping" size={150} x={905} y={650} delay={at('tın')} rotate={8} />
					</>
				) : null}
				{index === 3 ? (
					<>
						<Icon name="crying" size={140} x={170} y={480} delay={at('jilay')} rotate={-8} />
						<Icon name="hand" size={190} x={900} y={500} delay={at('toqtat')} rotate={10} />
					</>
				) : null}
				{index === 4 ? (
					<>
						<Icon name="baby1" size={150} x={330} y={500} delay={at('bir')} />
						<Icon name="baby2" size={150} x={540} y={470} delay={at('bir') + 5} />
						<Icon name="baby3" size={150} x={750} y={500} delay={at('bir') + 10} />
						<Icon name="sparkles" size={110} x={930} y={640} delay={at('túrli')} />
					</>
				) : null}
			</AbsoluteFill>
			<AbsoluteFill style={{opacity}}>
				<Subtitles words={words} offset={offset} keywords={qa.keywords} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const Header: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const current = QAS.reduce((acc, qa, i) => (t >= qa.qStart - 0.25 ? i : acc), 0);
	const enter = spring({frame, fps, config: {damping: 14}});
	const out = interpolate(frame, [VIDEO_FRAMES - 10, VIDEO_FRAMES], [1, 0], clamp);
	return (
		<div
			style={{
				position: 'absolute',
				top: 60,
				left: 0,
				right: 0,
				display: 'flex',
				justifyContent: 'center',
				opacity: enter * out,
				transform: `translateY(${(1 - enter) * -60}px)`,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 22,
					background: 'rgba(43,22,48,0.82)',
					borderRadius: 999,
					padding: '12px 30px 12px 14px',
				}}
			>
				<Img src={staticFile('icons/palms.webp')} style={{width: 62, height: 62}} />
				<div style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: 'white', letterSpacing: 3}}>
					BALALAR MASSAJI
				</div>
				<div style={{display: 'flex', gap: 10, marginLeft: 6}}>
					{QAS.map((_, i) => {
						const fill = interpolate(t, [QAS[i].qStart - 0.25, QAS[i].qStart + 0.15], [0, 1], clamp);
						return (
							<div
								key={i}
								style={{
									width: i === current ? 38 : 14,
									height: 14,
									borderRadius: 7,
									background: fill > 0.5 ? CORAL : 'rgba(255,255,255,0.35)',
								}}
							/>
						);
					})}
				</div>
			</div>
		</div>
	);
};

const BackgroundVideo: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	// Punch in on the face during answers, ease back out for each new question.
	let zoom = 1.025 + 0.02 * Math.sin(frame / 90);
	QAS.forEach((qa, i) => {
		const end = nextQStart(i) - 0.3;
		zoom += 0.12 * interpolate(t, [qa.aStart - 0.2, qa.aStart + 0.25, end - 0.35, end], [0, 1, 1, 0], {
			...clamp,
			easing: Easing.inOut(Easing.cubic),
		});
	});
	return (
		<AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '590px 760px'}}>
			<OffthreadVideo src={staticFile('nadira.mp4')} style={{filter: GRADE_FILTER}} />
			<AbsoluteFill style={{background: VIGNETTE}} />
		</AbsoluteFill>
	);
};

const Outro: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const fadeIn = interpolate(frame, [0, 12], [0, 1], clamp);
	const s = spring({frame: frame - 6, fps, config: {damping: 11}});
	const fadeOut = interpolate(frame, [OUTRO_FRAMES - 12, OUTRO_FRAMES], [1, 0], clamp);
	return (
		<AbsoluteFill style={{opacity: fadeOut}}>
			<AbsoluteFill style={{filter: `blur(${18 * fadeIn}px)`, transform: `scale(${1.04 + 0.08 * fadeIn})`}}>
				<Freeze frame={VIDEO_FRAMES - 3}>
					<OffthreadVideo src={staticFile('nadira.mp4')} muted style={{filter: GRADE_FILTER}} />
					<AbsoluteFill style={{background: VIGNETTE}} />
				</Freeze>
			</AbsoluteFill>
			<AbsoluteFill style={{background: `rgba(43,22,48,${0.55 * fadeIn})`}} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
				<div style={{position: 'relative', width: 1080, height: 700, transform: `scale(${s})`}}>
					<Icon name="baby" size={260} x={540} y={170} delay={4} bob={0.6} />
					<Icon name="heart" size={120} x={730} y={90} delay={12} rotate={14} />
					<Icon name="sparkles" size={110} x={340} y={80} delay={16} />
					<div
						style={{
							position: 'absolute',
							top: 340,
							left: 0,
							right: 0,
							textAlign: 'center',
							fontFamily: FONT,
							fontWeight: 900,
							fontSize: 96,
							color: 'white',
							letterSpacing: 4,
							lineHeight: 1.05,
							textShadow: '0 10px 30px rgba(0,0,0,0.4)',
						}}
					>
						BALALAR
						<br />
						<span style={{color: GOLD}}>MASSAJI</span>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

export const Montage: React.FC = () => {
	const musicVolume = (f: number) =>
		interpolate(
			f,
			[0, 10, VIDEO_FRAMES - 15, VIDEO_FRAMES + 5, VIDEO_FRAMES + OUTRO_FRAMES - 20, VIDEO_FRAMES + OUTRO_FRAMES],
			[0, 0.15, 0.15, 0.64, 0.64, 0],
			clamp,
		);
	return (
		<AbsoluteFill style={{background: 'black'}}>
			<GradeDefs />
			<Sequence durationInFrames={VIDEO_FRAMES}>
				<BackgroundVideo />
				<AbsoluteFill
					style={{
						background:
							'linear-gradient(180deg, rgba(0,0,0,0) 72%, rgba(10,4,12,0.55) 100%), linear-gradient(0deg, rgba(0,0,0,0) 88%, rgba(10,4,12,0.25) 100%)',
					}}
				/>
			</Sequence>

			{QAS.map((qa, i) => {
				const qFrom = sec(qa.qStart - 0.25);
				const qDur = sec(qa.aStart + 0.05) - qFrom;
				const aFrom = sec(qa.aStart - 0.2);
				const aDur = Math.min(VIDEO_FRAMES, sec(nextQStart(i) - 0.1)) - aFrom;
				return (
					<React.Fragment key={i}>
						<Sequence from={qFrom} durationInFrames={qDur}>
							<QuestionCard qa={qa} index={i} duration={qDur} offset={qFrom} />
						</Sequence>
						<Sequence from={Math.max(0, qFrom)} durationInFrames={20}>
							<Audio src={staticFile('sfx/whoosh.wav')} volume={0.36} />
						</Sequence>
						<Sequence from={qFrom + 8} durationInFrames={10}>
							<Audio src={staticFile('sfx/pop.wav')} volume={0.26} />
						</Sequence>
						<Sequence from={aFrom} durationInFrames={aDur}>
							<AnswerSection qa={qa} index={i} duration={aDur} offset={aFrom} />
						</Sequence>
						{qa.answer ? (
							<Sequence from={aFrom + 3} durationInFrames={40}>
								<Audio
									src={staticFile(qa.answer === 'yes' ? 'sfx/ding.wav' : 'sfx/no.wav')}
									volume={0.26}
								/>
							</Sequence>
						) : null}
					</React.Fragment>
				);
			})}

			<Sequence durationInFrames={VIDEO_FRAMES}>
				<Header />
			</Sequence>

			<Sequence from={VIDEO_FRAMES} durationInFrames={OUTRO_FRAMES}>
				<Outro />
				<Sequence from={4} durationInFrames={20}>
					<Audio src={staticFile('sfx/whoosh.wav')} volume={0.75} />
				</Sequence>
			</Sequence>

			<Audio src={staticFile('music.wav')} volume={musicVolume} />
		</AbsoluteFill>
	);
};
