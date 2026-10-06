import React from 'react';
import {Composition} from 'remotion';
import {FPS, TOTAL_FRAMES} from './data';
import {Montage} from './Montage';

export const Root: React.FC = () => {
	return (
		<Composition
			id="Nadira"
			component={Montage}
			durationInFrames={TOTAL_FRAMES}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	);
};
