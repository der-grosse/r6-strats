import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TeamMemberItem from "./TeamMemberItem";
import { useUser } from "@/components/context/UserContext";

export interface TeamMemberListProps {
  members: TeamMember[];
  onChangeColor: (member: TeamMember) => void;
  onChangeUbisoftID?: (member: TeamMember) => void;
}

export default function TeamMemberList(props: TeamMemberListProps) {
  const { user } = useUser();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Username</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined at</TableHead>
          {user?.isAdmin && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.members
          .toSorted((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
          .map((member) => (
            <TeamMemberItem
              key={member.id}
              member={member}
              onChangeColor={props.onChangeColor.bind(null, member)}
              onChangeUbisoftID={
                props.onChangeUbisoftID
                  ? props.onChangeUbisoftID.bind(null, member)
                  : undefined
              }
            />
          ))}
      </TableBody>
    </Table>
  );
}
