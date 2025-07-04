import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";
const VisuallyHidden = React.forwardRef(({ ...props }, ref) => (_jsx(VisuallyHiddenPrimitive.Root, { ref: ref, ...props })));
VisuallyHidden.displayName = VisuallyHiddenPrimitive.Root.displayName;
export { VisuallyHidden };
