import { Button } from '@/components/ui/button';
import { useShowcaseContext } from './context/showcase-context';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BsCaretDown,
  BsCaretUp,
  BsGear,
  BsInfo,
  BsInfoCircle,
  BsLayers,
} from 'react-icons/bs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SortBy } from '@/types/sortby';
import { layoutOptions } from '@/modules/showcase/layout-options';
import { sortOptions } from './sort-options';
import { ShowcaseConfig } from '@reviewsup/api/showcases';

function LayoutToggleButton(props: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { isOpen, setIsOpen, title, icon } = props;
  return (
    <div
      onClick={() => props.setIsOpen(!isOpen)}
      className={cn(
        'font-medium p-3 border border-gray-200 flex flex-row justify-between items-center select-none cursor-pointer hover:bg-gray-50 rounded',
        isOpen ? 'shadow border-gray-400' : '',
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <span
          className={cn('h-4 w-4', isOpen ? 'text-red-400' : 'text-gray-500')}
        >
          {icon}
        </span>

        <p
          className={cn(
            'text-sm',
            isOpen ? 'text-red-400 font-bold' : 'text-gray-500',
          )}
        >
          {title}
        </p>
      </div>
      {isOpen ? (
        <div>
          <BsCaretDown />
        </div>
      ) : (
        <div>
          <BsCaretUp />
        </div>
      )}
    </div>
  );
}

const ToggleOption = (props: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  information?: string;
}) => {
  const { label, checked, onChange, information } = props;
  return (
    <div className="flex flex-row justify-between items-center w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-row gap-2 items-center">
            <label className="text-sm">{label}</label>
            {information && <BsInfoCircle className="text-md" />}
          </div>
        </TooltipTrigger>
        {information && (
          <TooltipContent>
            <p>{information}</p>
          </TooltipContent>
        )}
      </Tooltip>

      <Input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
      />
    </div>
  );
};

export function ShowcasePageConfig(props: { className?: string }) {
  const {
    showcase,
    showcaseConfig,
    setShowcase,
    setShowcaseConfig,
    saveChange,
  } = useShowcaseContext();
  const [isLayoutOpen, setIsLayoutOpen] = useState(true);
  const [isSettingOpen, setIsSettingOpen] = useState(true);

  /**
   * Render columns count and breakpoints input fields when the layout type is grid or flow.
   * @param showcaseConfig
   */
  const renderColumnsCount = (showcaseConfig: ShowcaseConfig) => {
    if (showcaseConfig.type !== 'grid' && showcaseConfig.type !== 'flow') {
      return null;
    }
    return (
      <div>
        <label className="text-sm">Columns Count:</label>
        <div className="text-sm grid grid-cols-3 gap-2 mt-2">
          <label>sm:</label>
          <label>md:</label>
          <label>lg:</label>
          <Input
            type="number"
            min="1"
            max="5"
            className="w-full"
            value={showcaseConfig.breakpoints?.sm || 1}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setShowcaseConfig({
                  ...showcaseConfig,
                  breakpoints: {
                    ...showcaseConfig.breakpoints,
                    sm: value,
                  },
                });
              }
            }}
          />
          <Input
            type="number"
            min="1"
            max="5"
            className="w-full"
            value={showcaseConfig.breakpoints?.md || 2}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setShowcaseConfig({
                  ...showcaseConfig,
                  breakpoints: {
                    ...showcaseConfig.breakpoints,
                    md: value,
                  },
                });
              }
            }}
          />
          <Input
            type="number"
            min="1"
            max="5"
            className="w-full"
            value={showcaseConfig.breakpoints?.lg || 3}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setShowcaseConfig({
                  ...showcaseConfig,
                  breakpoints: {
                    ...showcaseConfig.breakpoints,
                    lg: value,
                  },
                });
              }
            }}
          />
        </div>
      </div>
    );
  };

  const renderRowsAndSpeed = (showcaseConfig: ShowcaseConfig) => {
    if (showcaseConfig.type !== 'carousel') {
      return null;
    }
    return (
      <>
        <div>
          <label className="text-sm">Rows Count:</label>
          <Input
            type="number"
            placeholder="Enter rows count"
            min="1"
            max="10"
            className="w-full mt-2"
            value={showcaseConfig.rows || 1}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setShowcaseConfig({
                  ...showcaseConfig,
                  rows: value,
                });
              }
            }}
          />
        </div>
        <div>
          <label className="text-sm">Speed:</label>
          <Input
            type="number"
            placeholder="Enter speed"
            min="1"
            max="120"
            className="w-full mt-2"
            value={showcaseConfig.speed || 40}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value)) {
                setShowcaseConfig({
                  ...showcaseConfig,
                  speed: value,
                });
              }
            }}
          />
        </div>
      </>
    );
  };

  if (!showcaseConfig) {
    return null;
  }
  return (
    <div className={cn('', props.className)}>
      <div className="w-full h-[700px] overflow-y-auto py-2">
        <div className="space-y-4 w-full pr-4 ">
          <LayoutToggleButton
            title="Layout"
            icon={<BsLayers className="h-4 w-4" />}
            isOpen={isLayoutOpen}
            setIsOpen={setIsLayoutOpen}
          />
          <div
            className={cn(
              'grid grid-cols-2 gap-2',
              isLayoutOpen ? '' : 'hidden',
            )}
          >
            {layoutOptions.map((opt) => (
              <div
                key={opt.value}
                className={`flex flex-row items-center gap-2 p-3 border rounded cursor-pointer ${
                  showcaseConfig.type === opt.value
                    ? 'border-red-400 bg-red-50 shadow'
                    : 'border-gray-300'
                }`}
                onClick={() => {
                  setShowcaseConfig({
                    ...showcaseConfig,
                    type: opt.value as ShowcaseConfig['type'],
                  });
                }}
              >
                {opt.icon}
                <span className="text-sm text-start">{opt.label}</span>
              </div>
            ))}
          </div>

          <LayoutToggleButton
            title="Settings"
            icon={<BsGear className="h-4 w-4" />}
            isOpen={isSettingOpen}
            setIsOpen={setIsSettingOpen}
          />
          <div
            className={cn(
              'flex flex-col gap-4 pb-4',
              isSettingOpen ? '' : 'hidden',
            )}
          >
            {renderColumnsCount(showcaseConfig)}
            {renderRowsAndSpeed(showcaseConfig)}

            <div>
              <label className="text-sm">Reviews Max Count:</label>
              <Input
                type="number"
                placeholder="Enter max count of reviews"
                min="1"
                max="100"
                className="w-full mt-2"
                value={showcaseConfig.count || 20}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setShowcaseConfig({
                      ...showcaseConfig,
                      count: value,
                    });
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm">Sort by:</label>
              <Select
                defaultValue={showcaseConfig.sortBy || 'newest'}
                onValueChange={(value) => {
                  setShowcaseConfig({
                    ...showcaseConfig,
                    sortBy: value as SortBy,
                  });
                }}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select sort option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <ToggleOption
              label="Show Summary Rating"
              checked={showcaseConfig.isRatingSummaryEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isRatingSummaryEnabled: checked,
                })
              }
            />
            <ToggleOption
              label="Show Rating"
              checked={showcaseConfig.isRatingEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isRatingEnabled: checked,
                })
              }
            />
            <ToggleOption
              label="Show Date"
              checked={showcaseConfig.isDateEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({ ...showcaseConfig, isDateEnabled: checked })
              }
            />
            <ToggleOption
              label="Show Images"
              checked={showcaseConfig.isImageEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isImageEnabled: checked,
                })
              }
            />
            <ToggleOption
              label="Show Video"
              checked={showcaseConfig.isVideoEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isVideoEnabled: checked,
                })
              }
            />

            <ToggleOption
              label="Show Source"
              checked={showcaseConfig.isSourceEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isSourceEnabled: checked,
                })
              }
            />
            <ToggleOption
              label="Show Reviews Powered By"
              checked={showcaseConfig.isPoweredByEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isPoweredByEnabled: checked,
                })
              }
            />
            <ToggleOption
              label="Dofollow enabled"
              checked={showcaseConfig.isDoFollowEnabled || false}
              onChange={(checked) =>
                setShowcaseConfig({
                  ...showcaseConfig,
                  isDoFollowEnabled: checked,
                })
              }
              information={'If enabled, the source link will be dofollow. If disabled, it will be nofollow.'}
            />
          </div>
        </div>
      </div>
      <div className="w-full pr-4">
        <Button className="w-full" onClick={saveChange}>
          Save
        </Button>
      </div>
    </div>
  );
}
