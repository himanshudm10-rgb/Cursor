import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './lib';
import {Main, TOTAL_FRAMES} from './Main';
import {Sheet} from './Sheet';

export const Root: React.FC = () => (
	<>
		<Composition id="Film" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
		<Composition id="Sheet" component={Sheet} durationInFrames={1} fps={FPS} width={2400} height={1400} />
	</>
);
