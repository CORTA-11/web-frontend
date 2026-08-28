import { toast } from "sonner";
import { errorMessage } from "@/lib/http";

/** Every mutation surfaces failures the same way. */
export const notifyError = (error: unknown) => toast.error(errorMessage(error));
