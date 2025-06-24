import { useNavigate, useParams } from "@solidjs/router";

export default function EditPage() {
  const params = useParams();
  const navigate = useNavigate();
  navigate('/?path=' + params.path);
}