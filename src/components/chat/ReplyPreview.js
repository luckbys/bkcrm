import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { Button } from '../ui/button';
export const ReplyPreview = ({ replyingTo, onCancel }) => {
    if (!replyingTo)
        return null;
    return (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 border-b", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "text-sm text-gray-600", children: ["Respondendo a ", _jsx("span", { className: "font-medium", children: replyingTo.senderName })] }), _jsx("div", { className: "text-sm text-gray-800 truncate", children: replyingTo.content })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onCancel, children: _jsx(X, { className: "w-4 h-4" }) })] }));
};
