import deleteIconSrc from "@/assets/images/delete-icon.png";

type Props = {
  size?: number | string;
};

const DeleteIcon = ({ size = 20 }: Props) => (
  <img
    src={deleteIconSrc}
    alt="delete"
    style={{ width: size, height: size, display: "block", objectFit: "contain" }}
  />
);

export default DeleteIcon;
