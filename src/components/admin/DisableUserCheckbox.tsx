import {BasicAccountInfo} from "@/types/accounts";
import {useEffect, useState} from "react";
import {disableUser} from "@/lib/actions/userActions";
import {toast} from "sonner";
import {Spinner} from "@/components/ui/spinner";
import {Checkbox} from "@/components/ui/checkbox";

export function DisableUserCheckbox(props: { user: BasicAccountInfo }) {
	const [disabling, setDisabling] = useState(false);

	// handles checkbox state
	const [checked, setChecked] = useState<boolean>(false);

	useEffect(() => {
		setChecked(props.user.disabled);
	}, []);

	const handleDisable = async (disabled: boolean) => {
		setDisabling(true);

		try {
			const d = await disableUser(disabled, props.user.id);
			if (!d.success) {
				toast.error(d.error, {id: "disable-user"});
				return;
			}
			// if disabled is undefined, go back to original state
			setChecked(d.data?.disabled != undefined ? d.data?.disabled : checked);
			const STATUS = checked ? "Enabled" : "Disabled";
			toast.success(`User ${STATUS} successfully`, {id: "disable-user", duration: 2000});
		} catch (error) {
			console.error(error);
			toast.error("An error occurred while creating new user", {id: "disable-user"});
			setChecked(!checked);
			return;
		} finally {
			setDisabling(false);
		}
	}

	return (
		disabling ?
			(
				<Spinner/>
			) : (
				<Checkbox disabled={disabling} checked={checked} id={`disable-${props.user.id}`}
				          onCheckedChange={(disabled) => {
					          if (disabled == true || disabled == false) {
						          handleDisable(disabled);
					          }
				          }}/>
			)
	);
}