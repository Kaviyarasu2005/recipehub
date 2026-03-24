import React from 'react';

interface UserAvatarProps {
    src?: string;
    name?: string;
    size?: number;
    className?: string;
    fallback?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ src, name = '?', size = 40, className = '', fallback }) => {
    const [imageError, setImageError] = React.useState(false);
    const initial = (fallback || name).charAt(0).toUpperCase();

    if (src && src.trim() !== '' && !imageError) {
        return (
            <img
                src={src}
                alt={name}
                className={`rounded-full object-cover bg-white ${className}`}
                style={{ width: size, height: size }}
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <div
            className={`rounded-full bg-[#a832d3] text-white flex items-center justify-center font-black ${className}`}
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initial}
        </div>
    );
};
