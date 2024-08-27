import AxiosInstance from '../provider/axiosProvider';
import { useLoaderData, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import Table from 'react-bootstrap/Table';
import FriendsLinkDiv from "./FriendsLinkDiv";
import Alert from 'react-bootstrap/Alert';
import Swal from 'sweetalert2';
import Button from 'react-bootstrap/Button';

export default function Friends() {
    const response = useLoaderData();
    const navigate = useNavigate()
    let [searchParams, setSearchParams] = useSearchParams();
    const addFriend = searchParams.get("addFriend");
    const user = response.data;
    const [pics, setPics] = useState(new Map());

    const removeFriend = (id) => {
        Swal.fire({
            text: "Are you sure you want to delete this friend?",
            icon: "error",
            confirmButtonText: "YES",
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                AxiosInstance.delete("/api/friends/" + id)
                    .then(response => {
                        navigate('/friends', { replace: true });
                    })
                    .catch(err => {
                        Swal.fire({
                            text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                            icon: "error",
                            confirmButtonText: "OK",
                        });
                    });
            }
        });
    }

    const getPic = async (id) => {
        return await AxiosInstance.get("/api/user/" + id + "/pic")
            .then(response => "data:image/png;base64," + response.data)
            .catch(err => "./shrug.png");
    }

    useEffect(() => {
        if (addFriend) {
            AxiosInstance.post("/api/friends/" + addFriend)
                .then(response => {
                    console.log("wehere?")
                    navigate('/friends', { replace: true });
                })
                .catch(err => {
                    Swal.fire({
                        text: err?.response?.data?._embedded?.errors?.[0]?.message || err["message"],
                        icon: "error",
                        confirmButtonText: "OK",
                    });
                });
        }
    }, []);

    useEffect(() => {
        async function fetchPics() {
            const pics = new Map();
            if (user.friends?.length > 0) {
                for (const friend of user.friends) {
                    pics.set(friend.id, await getPic(friend.id));
                }
            }
            setPics(pics);
        }
        fetchPics();
    }, [user]);

    if (user.friends === undefined || user.friends.length == 0) {
        return (
            <>
                <FriendsLinkDiv confirmationUuid={user.confirmationUuid} />
                <Alert className="mt-3" variant="warning">You don't have any friends yet! Send your link to your friends and have them click it.</Alert>
            </>
        );
    } else {
        return (
            <>
                <FriendsLinkDiv confirmationUuid={user.confirmationUuid} />
                <Table hover>
                    <thead>
                        <tr>
                            <th scope="col">Picture</th>
                            <th scope="col">Name</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {user.friends.map(function (friend) {
                            return <tr key={friend.id}><td><img width="150" height="150" className="img-thumbnail" src={pics.get(friend.id)} /></td><td>{friend.displayName}</td><td><Button variant="danger" onClick={() => removeFriend(friend.id)}>Remove</Button></td></tr>;
                        })}
                    </tbody>
                </Table>
            </>
        );
    }
}