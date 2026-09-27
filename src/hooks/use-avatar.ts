import { useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { errorMessage } from '@/lib/api';

const LOCAL_KEY = 'mtaa_avatar_uri';

export type AvatarMessage = { tone: 'success' | 'warning' | 'error'; text: string };

// Profile photo: uploads to Clerk when possible; if that fails, keeps the photo on this
// phone so the header still shows it, and says so plainly.
export function useAvatar() {
  const { user } = useUser();
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<AvatarMessage | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(LOCAL_KEY)
      .then((v) => v && setLocalUri(v))
      .catch(() => {});
  }, []);

  const keepLocal = (uri: string | null) => {
    setLocalUri(uri);
    (uri ? SecureStore.setItemAsync(LOCAL_KEY, uri) : SecureStore.deleteItemAsync(LOCAL_KEY)).catch(
      () => {},
    );
  };

  const pick = async () => {
    setMessage(null);
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
    } catch (e) {
      setMessage({ tone: 'error', text: `Couldn't open your photos. ${errorMessage(e)}` });
      return;
    }
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return;

    if (!user || !asset.base64) {
      keepLocal(asset.uri);
      setMessage({ tone: 'warning', text: 'Photo saved on this phone only.' });
      return;
    }

    setUploading(true);
    try {
      await user.setProfileImage({
        file: `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`,
      });
      await user.reload();
      keepLocal(null);
      setMessage({ tone: 'success', text: 'Profile photo updated.' });
    } catch (e) {
      keepLocal(asset.uri);
      setMessage({
        tone: 'warning',
        text: `Photo saved on this phone only. We couldn't upload it to your account: ${errorMessage(e)}`,
      });
    } finally {
      setUploading(false);
    }
  };

  const uri = localUri ?? (user?.hasImage ? user.imageUrl : null);
  const initial = (
    user?.firstName?.[0] ??
    user?.primaryEmailAddress?.emailAddress?.[0] ??
    ''
  ).toUpperCase();

  return { uri, initial, pick, uploading, message };
}
