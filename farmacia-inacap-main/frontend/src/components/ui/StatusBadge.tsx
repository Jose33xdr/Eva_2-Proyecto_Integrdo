import { translateChoiceLabel } from "../../lib/choiceLabels";
import "./ui.module.css";

const normalize = (value: string) => value.toLowerCase().replaceAll("_", "-");

export const StatusBadge = ({ value }: { value: string }) => (
  <span className={`status-badge status-badge--${normalize(value)}`}>
    {translateChoiceLabel(value)}
  </span>
);
