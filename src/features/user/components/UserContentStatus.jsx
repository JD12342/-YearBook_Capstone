export function UserContentStatus({ content, contentReady }) {
  return (
    <div className="user-content-status" role="status">
      <span className={content.hasLiveContent ? 'is-live' : ''} />
      {!contentReady
        ? 'Connecting to the school archive…'
        : content.hasLiveContent
          ? 'Showing published school content'
          : 'Archive preview · published content will appear automatically'}
    </div>
  )
}
