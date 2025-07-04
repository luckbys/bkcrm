import { useState } from 'react';
import { supabase } from '../lib/supabase';
export function useFileUpload() {
    const [state, setState] = useState({
        uploading: false,
        progress: 0,
        error: null,
    });
    const uploadFile = async (bucket, path, file, onProgress) => {
        try {
            setState({ uploading: true, progress: 0, error: null });
            // Verificar se o bucket existe, se não, criar
            const { data: buckets } = await supabase.storage.listBuckets();
            const bucketExists = buckets?.some(b => b.name === bucket);
            if (!bucketExists) {
                const { error: createError } = await supabase.storage.createBucket(bucket, {
                    public: true,
                    fileSizeLimit: 52428800, // 50MB em bytes
                    allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf']
                });
                if (createError)
                    throw createError;
            }
            // Gerar nome único para o arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${path}/${Date.now()}.${fileExt}`;
            // Upload do arquivo
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (error)
                throw error;
            // Obter URL pública do arquivo
            const { data: publicUrl } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);
            setState({ uploading: false, progress: 100, error: null });
            return {
                path: fileName,
                url: publicUrl.publicUrl
            };
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                uploading: false,
                error: error
            }));
            throw error;
        }
    };
    const deleteFile = async (bucket, path) => {
        try {
            setState({ uploading: false, progress: 0, error: null });
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path]);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                error: error
            }));
            throw error;
        }
    };
    const getFileUrl = (bucket, path) => {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    };
    return {
        uploading: state.uploading,
        progress: state.progress,
        error: state.error,
        uploadFile,
        deleteFile,
        getFileUrl
    };
}
