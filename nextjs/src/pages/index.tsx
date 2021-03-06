import e from 'cors';
import { signIn, SignInResponse, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import { useUserContext } from '../../provider/UserProvider';
import { useForm } from 'react-hook-form';



export default function Blank() {
    // const { login } = useUserContext()
    const router = useRouter()
    const { data: session, status } = useSession()
    console.log("🚀 ~ file: index.tsx ~ line 13 ~ Blank ~ session", status)


    // const checkValid = () => {
    //     login(email,password).catch(e => {
    //         setError(true)
    //     })
    // }
    useEffect(() => {

        if (status === "authenticated") {
            router.replace('/home')
        }
        else if (status === "unauthenticated")
            router.replace('/login')

        // else router.replace('/login')
    }, [status])



    return (

        <div id="container">

        </div>)
}