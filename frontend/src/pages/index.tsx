import CreateServer from "@/components/create-server";
import ServersList from "@/components/servers-list";
import { useGet } from "@/hooks/use-get";

import dockerode from "dockerode";

export type ServerType = dockerode.ContainerInspectInfo & dockerode.ContainerStats

export default function Index() {
    const { data: serverList, refetch } = useGet<ServerType[]>('/servers');


    return (
        <section className="h-full px-1 md:px-8 w-full">
            <CreateServer refreshServers={refetch} />
            <ServersList servers={serverList || []} refreshServers={refetch} />
        </section>
    );
}