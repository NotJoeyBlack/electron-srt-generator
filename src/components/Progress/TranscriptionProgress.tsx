import React from 'react';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  Stepper, 
  Step, 
  StepLabel, 
  Card, 
  CardContent,
  Fade,
  Chip
} from '@mui/material';
import { 
  CheckCircle, 
  RadioButtonUnchecked, 
  AccessTime,
  CloudUpload,
  Psychology,
  Subtitles,
  CheckCircleOutline
} from '@mui/icons-material';
import { ProgressUpdate } from '../../types';

interface TranscriptionProgressProps {
  progress: ProgressUpdate;
  isActive: boolean;
  startTime?: Date;
}

export const TranscriptionProgress: React.FC<TranscriptionProgressProps> = ({ 
  progress, 
  isActive, 
  startTime 
}) => {
  const steps = [
    {
      id: 'validation',
      label: 'Validation',
      description: 'Checking file format and size',
      icon: CheckCircleOutline,
    },
    {
      id: 'upload',
      label: 'Upload',
      description: 'Uploading to ElevenLabs',
      icon: CloudUpload,
    },
    {
      id: 'processing',
      label: 'Processing',
      description: 'Transcribing audio',
      icon: Psychology,
    },
    {
      id: 'srt-generation',
      label: 'SRT Generation',
      description: 'Creating subtitle file',
      icon: Subtitles,
    },
    {
      id: 'complete',
      label: 'Complete',
      description: 'Transcription finished',
      icon: CheckCircle,
    },
  ];

  const getStepIndex = (stage: string): number => {
    return steps.findIndex(step => step.id === stage);
  };

  const getStepIcon = (stepId: string, isCompleted: boolean, isActive: boolean) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return <RadioButtonUnchecked />;
    
    const IconComponent = step.icon;
    
    if (isCompleted) {
      return <CheckCircle color="success" />;
    } else if (isActive) {
      return <IconComponent color="primary" className="pulse" />;
    } else {
      return <RadioButtonUnchecked color="disabled" />;
    }
  };

  const getElapsedTime = (): string => {
    if (!startTime) return '0s';
    
    const elapsed = Date.now() - startTime.getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const currentStepIndex = getStepIndex(progress.stage);
  const isCompleted = progress.stage === 'complete';

  return (
    <Fade in={isActive}>
      <Card className="card-hover">
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Transcription Progress
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {isActive && (
                <Chip
                  icon={<AccessTime />}
                  label={getElapsedTime()}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              <Chip
                label={`${progress.percentage}%`}
                size="small"
                color={isCompleted ? 'success' : 'primary'}
                variant="filled"
              />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {progress.message}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress.percentage}
              sx={{ 
                height: 8,
                borderRadius: 4,
                backgroundColor: 'divider',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: isCompleted 
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)',
                },
              }}
              className={isActive ? 'progress-glow' : ''}
            />
          </Box>

          <Stepper activeStep={currentStepIndex} orientation="vertical">
            {steps.map((step, index) => {
              const isStepCompleted = index < currentStepIndex || isCompleted;
              const isStepActive = index === currentStepIndex && isActive;
              
              return (
                <Step key={step.id} completed={isStepCompleted}>
                  <StepLabel
                    icon={getStepIcon(step.id, isStepCompleted, isStepActive)}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: isStepCompleted ? 'success.main' : 
                               isStepActive ? 'primary.main' : 'text.secondary',
                        fontWeight: isStepActive ? 600 : 400,
                      },
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 'inherit' }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          {isCompleted && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: 'success.dark',
                color: 'success.contrastText',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              className="success-animation"
            >
              <CheckCircle />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Transcription completed successfully!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Fade>
  );
};