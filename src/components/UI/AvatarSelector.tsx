import React from 'react';
import AvatarPreview3D from '../AvatarPreview3D';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface AvatarObject {
  file: string;
  name?: string;
  index?: number;
}

interface AvatarSelectorProps {
  avatars: AvatarObject[];
  selectedAvatar: string;
  onSelect: (file: string) => void;
}

function getLabelFromFilename(filename: string): string {
  const name = filename.replace(/\.[^/.]+$/, "");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function AvatarSelector({ avatars, selectedAvatar, onSelect }: AvatarSelectorProps) {
  return (
    <Stack direction="row" spacing={3} mt={1}>
      {avatars.map(avatarObj => {
        const label = avatarObj.name || getLabelFromFilename(avatarObj.file);
        return (
          <Stack key={avatarObj.file} alignItems="center">
            <AvatarPreview3D
              modelUrl={`/models/avatars/${avatarObj.file}`}
              selected={selectedAvatar === avatarObj.file}
              onClick={() => onSelect(avatarObj.file)}
            />
            <Typography mt={1} fontWeight={selectedAvatar === avatarObj.file ? 'bold' : 'normal'}>
              {label}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
