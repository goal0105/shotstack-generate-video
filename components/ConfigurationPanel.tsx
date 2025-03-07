import PlatformSelection from '@components/PlatformSelection';
import ContentDropdown from '@components/ContentDropdown';
import VoiceSelection from '@components/VoiceSelection';
import CreateButton from '@components/CreateButton';
// import TextInput from '@components/TextInput';
import { VideoStatus } from '@constants/status';
import { VideoConfig } from '@models/config';

type ConfigurationPanelProps = {
  config: VideoConfig;
  setConfig: React.Dispatch<React.SetStateAction<VideoConfig>>;
  onCreate: () => void;
  status: string;
};

function ConfigurationPanel({
  config,
  setConfig,
  onCreate,
  status
}: ConfigurationPanelProps) {
  const isValid = Object.values(config).every(option => option !== '');
  const isDisabled =
    !isValid ||
    !(
      status === VideoStatus.DONE ||
      status === VideoStatus.FAILED ||
      status === ''
    );

  return (
    // <div className="bg-background h-full p-5 border-r border-gray-300 overflow-y-auto">
    //   <PlatformSelection config={config} setConfig={setConfig} />
    //   <ContentDropdown config={config} setConfig={setConfig} />
    //   <VoiceSelection config={config} setConfig={setConfig} /> 
    // </div>

    <div className="bg-background h-screen p-5 border-r border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <p className="text-3xl font-bold mb-4 p-2">Creating Video Demo</p>
        {/* <TextInput  
        label="Caption"
        value={''}
        onChange={onChange}
        placeholder = "input the text"/>         */}
        <CreateButton onCreate={onCreate} disabled={false} />

      </div>
    </div>
  );
}

export default ConfigurationPanel;
