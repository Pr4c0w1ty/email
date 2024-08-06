document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // submit handler
  document.querySelector("#compose-form").addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function send_email(event) {
  event.preventDefault();

  // Store fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send to backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox('sent');
  });

}

function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);

    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-details-view').style.display = 'block';

    document.querySelector('#email-details-view').innerHTML = `
      <ul class="list-group">
        <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
        <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
        <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
        <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
        <button id="replybtn"></button>
        <button id="archivebtn">${email.archived ? 'Unarchive' : 'Archive'}</button>
        
        <p>${email.body}</p>
      </ul>
    `;

    if (!email.read) {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });
    }
    // reply button
    const replyButton = document.getElementById('replybtn');
    replyButton.innerHTML = 'Reply';
    replyButton.className = 'btn btn-success';
    replyButton.addEventListener('click', () => {
      compose_email();

      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    });
    document.querySelector('#email-details-view').append(replyButton);

    // Ensure the archive button is appended and event listener is added after the innerHTML is set
    const archiveButton = document.getElementById('archivebtn');
    archiveButton.className = email.archived ? "btn btn-danger" : "btn btn-warning";
    archiveButton.addEventListener('click', () => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({ archived: !email.archived })
      })
      .then(() => load_mailbox(email.archived ? 'inbox' : 'archive'));
    });
  })
  document.querySelector('#email-details-view').append(archiveButton);


}




function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  //  get emails for mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // loop
      console.log(emails);
      emails.forEach(singleEmail => {
        console.log(singleEmail);

        const newEmail = document.createElement('div');
        newEmail.className = "list-group-item";
        newEmail.innerHTML = `
        <h4>Sender: ${singleEmail.sender}</h4>
        <h5>Subject: ${singleEmail.subject}</h5>
        <p>${singleEmail.timestamp}</p>
        `;
        // change background color
        newEmail.className = singleEmail.read ? "read" : "unread";

        // add click event
        newEmail.addEventListener('click', function() {
          view_email(singleEmail.id);
        });
        document.querySelector('#emails-view').append(newEmail);
      });
  });
}
