import { Link, useRouteError } from "react-router-dom";
import Button from "react-bootstrap/Button";

export default function ErrorPage() {
    const error = useRouteError();
    console.error(error);
    return (
        <div className="panel text-center py-5">
            <img src="/shrug.png" width="120" height="120" alt="" className="mb-3" />
            <h1 className="h3">Oops!</h1>
            <p className="text-body-secondary">Sorry, something went wrong. Please try again later.</p>
            <Button as={Link} to="/" reloadDocument variant="primary">Back to picks</Button>
        </div>
    );
}
