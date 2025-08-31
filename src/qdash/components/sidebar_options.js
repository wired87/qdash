import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Users, FileText, Mail, Calendar, Star, Clock, Tag } from "lucide-react"

// Sample data arrays for each accordion section
const sampleData = {
  users: [
    { id: 1, name: "John Doe", email: "john@example.com", status: "active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", status: "inactive" },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", status: "active" },
    { id: 4, name: "Sarah Wilson", email: "sarah@example.com", status: "pending" },
  ],
  documents: [
    { id: 1, title: "Project Proposal", type: "PDF", date: "2024-01-15" },
    { id: 2, title: "Meeting Notes", type: "DOC", date: "2024-01-14" },
    { id: 3, title: "Budget Report", type: "XLS", date: "2024-01-13" },
    { id: 4, title: "Design Mockups", type: "PNG", date: "2024-01-12" },
  ],
  messages: [
    { id: 1, subject: "Welcome to the platform", sender: "Admin", priority: "high" },
    { id: 2, subject: "Your account has been verified", sender: "System", priority: "medium" },
    { id: 3, subject: "New feature announcement", sender: "Product Team", priority: "low" },
    { id: 4, subject: "Security update required", sender: "Security", priority: "high" },
  ],
  events: [
    { id: 1, title: "Team Meeting", date: "2024-01-20", time: "10:00 AM" },
    { id: 2, title: "Project Deadline", date: "2024-01-25", time: "5:00 PM" },
    { id: 3, title: "Client Presentation", date: "2024-01-30", time: "2:00 PM" },
    { id: 4, title: "Code Review", date: "2024-02-01", time: "11:00 AM" },
  ],
}

export function SidebarWithAccordion() {
  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Manage your content</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {/* Users Section */}
        <AccordionItem value="users" className="border border-sidebar-border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:bg-sidebar-accent rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4 text-sidebar-primary" />
              <span className="font-medium">Users</span>
              <Badge variant="secondary" className="ml-auto">
                {sampleData.users.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {sampleData.users.map((user) => (
                <Card key={user.id} className="p-3 hover:bg-sidebar-accent cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge
                      variant={
                        user.status === "active" ? "default" : user.status === "inactive" ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {user.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Documents Section */}
        <AccordionItem value="documents" className="border border-sidebar-border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:bg-sidebar-accent rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-sidebar-primary" />
              <span className="font-medium">Documents</span>
              <Badge variant="secondary" className="ml-auto">
                {sampleData.documents.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {sampleData.documents.map((doc) => (
                <Card key={doc.id} className="p-3 hover:bg-sidebar-accent cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{doc.type}</span>
                        <Clock className="h-3 w-3 text-muted-foreground ml-2" />
                        <span className="text-xs text-muted-foreground">{doc.date}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Messages Section */}
        <AccordionItem value="messages" className="border border-sidebar-border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:bg-sidebar-accent rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-sidebar-primary" />
              <span className="font-medium">Messages</span>
              <Badge variant="secondary" className="ml-auto">
                {sampleData.messages.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {sampleData.messages.map((message) => (
                <Card key={message.id} className="p-3 hover:bg-sidebar-accent cursor-pointer transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-sm leading-tight">{message.subject}</p>
                      <Star className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{message.sender}</span>
                      <Badge
                        variant={
                          message.priority === "high"
                            ? "destructive"
                            : message.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {message.priority}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Events Section */}
        <AccordionItem value="events" className="border border-sidebar-border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:bg-sidebar-accent rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-sidebar-primary" />
              <span className="font-medium">Events</span>
              <Badge variant="secondary" className="ml-auto">
                {sampleData.events.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2">
              {sampleData.events.map((event) => (
                <Card key={event.id} className="p-3 hover:bg-sidebar-accent cursor-pointer transition-colors">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
