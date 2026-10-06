import {Config} from '@remotion/cli/config';

// Maximum quality defaults, also used by the Render button in Remotion Studio.
Config.setVideoImageFormat('png');
Config.setCodec('h264');
Config.setCrf(12);
Config.setX264Preset('slow');
Config.setOverwriteOutput(true);
