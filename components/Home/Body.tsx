import Image from 'next/image'
import InstantMeet from './InstantMeet'

const Body = () => {
  return (
    <div className="flex flex-col lg:flex-row items-center justify-between p-8">
      <div className="lg:w-1/2 mb-6 lg:mb-0">
        <h3 className="text-3xl font-semibold mb-4">
          Video Calls and Meetings for Everyone
        </h3>
        <InstantMeet />
      </div>

      <div className="lg:w-1/2 flex flex-col items-center">
        <Image
          src="/home-page.png"
          alt="People in a call"
          width={400}
          height={400}
          className="object-contain"
        />
        <div className="mt-4 text-center mr-19">
          <h4 className="text-lg font-medium">Get a link that you can share</h4>
          <p className="text-white-600 mt-1 text-sm">
            Click on <strong>Start an Instant Meet</strong> to get a link that you can share with another person.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Body
