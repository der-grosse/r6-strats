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
  onChangeUsername: (member: TeamMember) => void;
  onChangePassword: () => void;
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
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.members
          .toSorted((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
          .map((member) => (
            <TeamMemberItem
              key={member.id}
              user={user}
              member={member}
              onChangeColor={props.onChangeColor.bind(null, member)}
              onChangePassword={props.onChangePassword}
              onChangeUsername={props.onChangeUsername.bind(null, member)}
            />
          ))}
      </TableBody>
    </Table>
  );
}
